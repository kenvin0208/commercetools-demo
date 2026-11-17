"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { apiRoot } from "@/src/lib/commercetools/client";
import type { MyCustomerUpdateAction, MyShoppingListUpdateAction } from "@commercetools/platform-sdk";
import { clearCustomerSession, currentCustomer, customerApi, startCustomerSession } from "./session";
import { resetEmailConfiguration, sendPasswordResetEmail } from "./email";
import { limitAccountAttempts } from "./rate-limit";
import { AccountInputError, actionError, addressFields, dateOfBirthField, emailField, field, passwordField, positiveInteger, safeReturnTo, statusCode, type ActionState } from "./validation";

export async function signInAction(_state: ActionState, data: FormData): Promise<ActionState> {
  try {
    const email = emailField(data);
    limitAccountAttempts("login", email);
    // Existing customer passwords can be shorter than the policy for new passwords.
    const password = data.get("password");
    if (typeof password !== "string" || !password || password.length > 128) throw new AccountInputError("Please enter your password.");
    await startCustomerSession(email, password);
  } catch (error) { return actionError(error); }
  redirect(safeReturnTo(data.get("returnTo")));
}

export async function registerAction(_state: ActionState, data: FormData): Promise<ActionState> {
  try {
    if (!apiRoot) throw new Error("Customer service not configured.");
    const email = emailField(data);
    const password = passwordField(data, "password", true);
    const address = addressFields(data);
    limitAccountAttempts("register", email, 5);
    await apiRoot.customers().post({ body: {
      email, password, firstName: address.firstName, lastName: address.lastName,
      addresses: [address], defaultShippingAddress: 0, defaultBillingAddress: 0,
    } }).execute();
  } catch (error) {
    if (statusCode(error) === 400) return { error: "Unable to create this account. Check the details, or try signing in or resetting your password." };
    return actionError(error);
  }
  redirect("/account/login?registered=1");
}

export async function signOutAction() {
  await clearCustomerSession();
  revalidatePath("/account", "layout");
  redirect("/account/login");
}

export async function forgotPasswordAction(_state: ActionState, data: FormData): Promise<ActionState> {
  try {
    const email = emailField(data);
    resetEmailConfiguration();
    limitAccountAttempts("reset", email, 3);
    if (!apiRoot) throw new Error("Customer service not configured.");
    try {
      const token = await apiRoot.customers().passwordToken().post({ body: {
        email, ttlMinutes: 30, invalidateOlderTokens: true,
      } }).execute();
      await sendPasswordResetEmail(email, token.body.value);
    } catch (error) {
      // Identical public response for missing customers and email-provider failures.
      // Never log SDK errors: they can contain tokens and Authorization headers.
      if (statusCode(error) !== 400 && statusCode(error) !== 404) console.error("Password reset could not be delivered. Check the email service configuration and availability.");
    }
    return { success: "If an account exists for this email, you will receive a password reset link shortly. Check your spam folder too." };
  } catch (error) { return actionError(error); }
}

export async function resetPasswordAction(_state: ActionState, data: FormData): Promise<ActionState> {
  try {
    if (!apiRoot) throw new Error("Customer service not configured.");
    const tokenValue = field(data, "token", true, 1024);
    const newPassword = passwordField(data, "newPassword", true);
    limitAccountAttempts("reset-token", tokenValue, 5);
    await apiRoot.customers().passwordReset().post({ body: { tokenValue, newPassword } }).execute();
    await clearCustomerSession();
  } catch (error) {
    if (statusCode(error) === 400 || statusCode(error) === 404) return { error: "This reset link is invalid or expired. Please request a new one." };
    return actionError(error);
  }
  redirect("/account/login?reset=1");
}

export async function updateProfileAction(_state: ActionState, data: FormData): Promise<ActionState> {
  try {
    await (await customerApi()).post({ body: {
      version: positiveInteger(data, "version", Number.MAX_SAFE_INTEGER), actions: [
        { action: "setFirstName", firstName: field(data, "firstName", true, 100) },
        { action: "setLastName", lastName: field(data, "lastName", true, 100) },
        { action: "setDateOfBirth", dateOfBirth: dateOfBirthField(data) },
      ],
    } }).execute();
    revalidatePath("/account", "layout");
    return { success: "Your profile has been updated." };
  } catch (error) { return actionError(error); }
}

export async function changePasswordAction(_state: ActionState, data: FormData): Promise<ActionState> {
  try {
    const newPassword = passwordField(data, "newPassword", true);
    const currentPassword = data.get("currentPassword");
    if (typeof currentPassword !== "string" || !currentPassword || currentPassword.length > 128) throw new AccountInputError("Please enter your current password.");
    const customer = await currentCustomer();
    if (!customer) throw Object.assign(new Error("Sign in required"), { statusCode: 401 });
    limitAccountAttempts("change-password", customer.id);
    await (await customerApi()).password().post({ body: {
      version: positiveInteger(data, "version", Number.MAX_SAFE_INTEGER), currentPassword, newPassword,
    } }).execute();
    await clearCustomerSession();
  } catch (error) {
    if (statusCode(error) === 400) return { error: "Your current password is incorrect or the new password is invalid." };
    return actionError(error);
  }
  redirect("/account/login?changed=1");
}

export async function saveAddressAction(_state: ActionState, data: FormData): Promise<ActionState> {
  try {
    const address = addressFields(data);
    const addressId = field(data, "addressId", false);
    const api = await customerApi();
    const customer = (await api.get().execute()).body;
    const existing = addressId ? customer.addresses.find(item => item.id === addressId) : undefined;
    if (addressId && !existing) throw new AccountInputError("Address not found.");
    // Preserve fields maintained by other integrations when editing an address.
    const actions: MyCustomerUpdateAction[] = [addressId
      ? { action: "changeAddress", addressId, address: { ...existing, ...address } }
      : { action: "addAddress", address }];
    await api.post({ body: { version: positiveInteger(data, "version", Number.MAX_SAFE_INTEGER), actions } }).execute();
    revalidatePath("/account", "layout");
    return { success: addressId ? "Address updated." : "Address added." };
  } catch (error) { return actionError(error); }
}

export async function addressAction(_state: ActionState, data: FormData): Promise<ActionState> {
  try {
    const addressId = field(data, "addressId");
    const operation = field(data, "operation");
    if (!["removeAddress", "setDefaultShippingAddress", "setDefaultBillingAddress"].includes(operation)) throw new AccountInputError("Invalid address operation.");
    const api = await customerApi();
    const customer = (await api.get().execute()).body;
    if (!customer.addresses.some(address => address.id === addressId)) throw new AccountInputError("Address not found.");
    const action = { action: operation, addressId } as MyCustomerUpdateAction;
    await api.post({ body: { version: positiveInteger(data, "version", Number.MAX_SAFE_INTEGER), actions: [action] } }).execute();
    revalidatePath("/account", "layout");
    return { success: "Address book updated." };
  } catch (error) { return actionError(error); }
}

export async function addToWishlistAction(_state: ActionState, data: FormData): Promise<ActionState> {
  // Redirect outside try/catch so Next.js can handle navigation normally.
  const customer = await currentCustomer();
  if (!customer) redirect(`/account/login?returnTo=${encodeURIComponent(safeReturnTo(data.get("returnTo")))}`);
  try {
    const productId = field(data, "productId");
    if (!/^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(productId)) throw new AccountInputError("This demo product cannot be saved. Please choose a product from the store catalog.");
    const variantId = positiveInteger(data, "variantId", Number.MAX_SAFE_INTEGER);
    const api = await customerApi();
    const key = `wishlist-${customer.id}`;
    let list = (await api.shoppingLists().get({ queryArgs: { where: `key="${key}"`, limit: 1 } }).execute()).body.results[0];
    if (!list) {
      if (!apiRoot) throw new Error("Customer service not configured.");
      try {
        // MyShoppingListDraft has no key field. Create the uniquely keyed list on
        // the server, binding ownership only to the authenticated customer.
        list = (await apiRoot.shoppingLists().post({ body: { key, name: { "en-US": "My wishlist" },
          customer: { typeId: "customer", id: customer.id },
        } }).execute()).body;
      } catch (error) {
        if (statusCode(error) !== 400 && statusCode(error) !== 409) throw error;
        list = (await api.shoppingLists().get({ queryArgs: { where: `key="${key}"`, limit: 1 } }).execute()).body.results[0];
        if (!list) throw error;
      }
    }
    if (list.lineItems.some(item => item.productId === productId && item.variantId === variantId)) return { success: "Already in your wishlist." };
    await api.shoppingLists().withId({ ID: list.id }).post({ body: {
      version: list.version, actions: [{ action: "addLineItem", productId, variantId, quantity: 1 }],
    } }).execute();
    revalidatePath("/account/wishlist");
    return { success: "Saved to your wishlist." };
  } catch (error) { return actionError(error); }
}

export async function updateWishlistAction(_state: ActionState, data: FormData): Promise<ActionState> {
  try {
    const listId = field(data, "listId");
    const lineItemId = field(data, "lineItemId");
    const operation = field(data, "operation");
    let action: MyShoppingListUpdateAction;
    if (operation === "remove") action = { action: "removeLineItem", lineItemId };
    else if (operation === "quantity") action = { action: "changeLineItemQuantity", lineItemId, quantity: positiveInteger(data, "quantity") };
    else throw new AccountInputError("Invalid wishlist operation.");
    // /me enforces ownership even if listId is manipulated.
    await (await customerApi()).shoppingLists().withId({ ID: listId }).post({ body: {
      version: positiveInteger(data, "version", Number.MAX_SAFE_INTEGER), actions: [action],
    } }).execute();
    revalidatePath("/account/wishlist");
    return { success: operation === "remove" ? "Product removed." : "Wishlist updated." };
  } catch (error) { return actionError(error); }
}
