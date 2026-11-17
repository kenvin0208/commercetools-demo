import "server-only";
import { apiRoot } from "@/src/lib/commercetools/client";
import { notFound, redirect } from "next/navigation";
import { customerApi, requireCustomer } from "./session";
import { statusCode } from "./validation";

export async function customerWishlist() {
  const customer = await requireCustomer();
  const response = await accountRead(async () => (await customerApi()).shoppingLists().get({ queryArgs: {
    where: `key="wishlist-${customer.id}"`, limit: 1, expand: ["lineItems[*].variant"],
  } }).execute());
  return response.body.results[0] ?? null;
}

export async function customerOrders(page = 1) {
  await requireCustomer();
  return (await accountRead(async () => (await customerApi()).orders().get({ queryArgs: {
    sort: "createdAt desc", limit: 10, offset: (page - 1) * 10,
  } }).execute())).body;
}

export async function customerOrder(id: string) {
  const customer = await requireCustomer();
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  // Verify ownership before using server credentials for expanded references.
  const owned = (await accountRead(async () => (await customerApi()).orders().withId({ ID: id }).get().execute())).body;
  if (owned.customerId !== customer.id) notFound();
  const admin = apiRoot;
  if (!admin) throw new Error("Order service not configured.");
  const order = (await accountRead(() => admin.orders().withId({ ID: id }).get({ queryArgs: {
    expand: ["state", "paymentInfo.payments[*]", "discountCodes[*].discountCode"],
  } }).execute())).body;
  if (order.customerId !== customer.id) notFound();
  return order;
}

async function accountRead<T>(read: () => Promise<T>): Promise<T> {
  try { return await read(); }
  catch (error) {
    if (statusCode(error) === 404) notFound();
    if (statusCode(error) === 401) redirect("/account/login");
    // SDK errors can contain request credentials; never forward them to Next's
    // error logger or to a client component.
    throw new Error("The account service is temporarily unavailable.");
  }
}
