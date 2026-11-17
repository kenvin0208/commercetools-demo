import type { BaseAddress } from "@commercetools/platform-sdk";

export type ActionState = { error?: string; success?: string };
export class AccountInputError extends Error {}

export function field(data: FormData, name: string, required = true, max = 256): string {
  const value = data.get(name);
  const text = typeof value === "string" ? value.trim() : "";
  if ((required && !text) || text.length > max) {
    throw new AccountInputError(`Please enter a valid ${name.replace(/([A-Z])/g, " $1").toLowerCase()}.`);
  }
  return text;
}

export function emailField(data: FormData): string {
  const email = field(data, "email", true, 254).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new AccountInputError("Please enter a valid email address.");
  return email;
}

export function passwordField(data: FormData, name = "password", confirm = false): string {
  const value = data.get(name);
  if (typeof value !== "string" || value.length < 8 || value.length > 128) {
    throw new AccountInputError("Password must contain between 8 and 128 characters.");
  }
  if (confirm && value !== data.get("confirmPassword")) throw new AccountInputError("Passwords do not match.");
  return value;
}

export function dateOfBirthField(data: FormData): string | undefined {
  const value = field(data, "dateOfBirth", false, 10);
  if (!value) return undefined;
  const date = new Date(`${value}T00:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value || date > new Date()) {
    throw new AccountInputError("Please enter a valid date of birth in the past.");
  }
  return value;
}

export function addressFields(data: FormData): BaseAddress {
  const country = field(data, "country", true, 2).toUpperCase();
  // Validate an ISO country code rather than accepting arbitrary two-letter strings.
  if (!/^[A-Z]{2}$/.test(country) || new Intl.DisplayNames(["en"], { type: "region" }).of(country) === country) {
    throw new AccountInputError("Please select a valid country.");
  }
  const phone = field(data, "phone", true, 30);
  if (!/^[+\d\s().-]{6,30}$/.test(phone)) throw new AccountInputError("Please enter a valid phone number.");
  return {
    firstName: field(data, "firstName", true, 100),
    lastName: field(data, "lastName", true, 100),
    streetName: field(data, "streetName"),
    additionalStreetInfo: field(data, "additionalStreetInfo", false),
    city: field(data, "city", true, 100),
    state: field(data, "state", false, 100),
    postalCode: field(data, "postalCode", false, 30),
    country,
    phone,
  };
}

export function positiveInteger(data: FormData, name: string, max = 999): number {
  const value = Number(field(data, name));
  if (!Number.isSafeInteger(value) || value < 1 || value > max) throw new AccountInputError(`Please enter a valid ${name}.`);
  return value;
}

export function safeReturnTo(value: unknown): string {
  return typeof value === "string" && value.startsWith("/") && !value.startsWith("//") && !/[\\\r\n]/.test(value) && !value.startsWith("/account/login")
    ? value : "/account/profile";
}

export function statusCode(error: unknown): number | undefined {
  return typeof error === "object" && error !== null && "statusCode" in error ? Number(error.statusCode) : undefined;
}

export function actionError(error: unknown): ActionState {
  if (error instanceof AccountInputError) return { error: error.message };
  // SDK authentication errors carry OAuth failures in body.error and may have
  // neither statusCode nor message. Never log the complete SDK error object.
  const body = typeof error === "object" && error !== null && "body" in error ? error.body : undefined;
  const oauthError = typeof body === "object" && body !== null && "error" in body ? body.error : undefined;
  if (oauthError === "invalid_scope" || oauthError === "invalid_client") {
    console.error(`[account] commercetools OAuth ${oauthError}. Check CT_CLIENT_ID / CT_CLIENT_SECRET and the server client's scopes; keep customer credentials in CT_CUSTOMER_CLIENT_ID / CT_CUSTOMER_CLIENT_SECRET.`);
    return { error: "The account service is not configured correctly. Please contact the store administrator." };
  }
  const status = statusCode(error);
  if (status === 401) return { error: "Your session has expired. Please sign in again." };
  if (status === 409) return { error: "This information has changed. Refresh the page and try again." };
  if (status === 404) return { error: "The requested item no longer exists. Refresh the page and try again." };
  if (status === 400) return { error: "Unable to save. Please check your information and try again." };
  return { error: "The account service is temporarily unavailable. Please try again later." };
}
