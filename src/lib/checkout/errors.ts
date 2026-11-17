export type CheckoutStage = "customer" | "authentication" | "configuration" | "cart" | "session";
export type CheckoutRecovery = "address" | "cart" | "login";

export class CheckoutServiceError extends Error {
  constructor(
    readonly stage: CheckoutStage,
    readonly code: string,
    message: string,
    readonly status = 502,
    readonly recovery?: CheckoutRecovery,
  ) { super(message); }
}

export async function checkoutResponse<T>(response: Response, stage: CheckoutStage): Promise<T> {
  if (response.ok) return await response.json() as T;
  const body: unknown = await response.json().catch(() => null);
  const record = typeof body === "object" && body !== null ? body as Record<string, unknown> : {};
  const errors = Array.isArray(record.errors) ? record.errors : [];
  const codes = errors.map(error => typeof error === "object" && error !== null && "code" in error ? error.code : undefined);
  const knownCode = codes.find(code => ["MissingTaxRateForCountry", "MatchingPriceNotFound", "OutOfStock", "PriceChanged", "InvalidOperation", "InvalidShippingMethod"].includes(String(code)));
  if (stage === "authentication" || response.status === 401 || response.status === 403) {
    throw new CheckoutServiceError(stage, "AUTH_CONFIGURATION", "Checkout is not configured correctly. Please contact the store administrator.", 503);
  }
  if (knownCode === "MissingTaxRateForCountry") {
    throw new CheckoutServiceError(stage, knownCode, "Checkout is not available for this delivery address because its tax rate has not been configured. Please use another delivery address or contact the store.", 422, "address");
  }
  if (knownCode === "MatchingPriceNotFound") {
    throw new CheckoutServiceError(stage, knownCode, "An item has no price for the delivery country and selected currency. Please review your cart or choose another delivery address.", 422, "address");
  }
  if (knownCode === "OutOfStock" || knownCode === "PriceChanged") {
    throw new CheckoutServiceError(stage, knownCode, "An item's availability or price has changed. Please review your cart and try again.", 409, "cart");
  }
  // Classify the provider response, but never expose its text (which may contain
  // customer details) in the browser or server logs.
  const shippingFailure = knownCode === "InvalidShippingMethod" || (knownCode === "InvalidOperation" && errors.some(error => typeof error?.message === "string" && /shipping/i.test(error.message)));
  if (stage === "cart" && shippingFailure) {
    throw new CheckoutServiceError(stage, "SHIPPING_UNAVAILABLE", "No shipping option is available for this delivery address and currency. Please choose another address or contact the store.", 422, "address");
  }
  if (stage === "session") {
    throw new CheckoutServiceError(stage, "SESSION_REJECTED", "The payment checkout could not be started. Please try again or contact the store.");
  }
  throw new CheckoutServiceError(stage, "UPSTREAM_REJECTED", "Checkout could not prepare your cart. Please review your items and delivery address, then try again.", 502, "cart");
}

export function validateCheckoutMarket(project: { countries: string[]; currencies: string[] }, country: string, currency: string) {
  if (!project.countries.includes(country)) {
    const name = new Intl.DisplayNames(["en"], { type: "region" }).of(country) ?? country;
    throw new CheckoutServiceError("configuration", "DELIVERY_COUNTRY_UNSUPPORTED", `We do not currently deliver to ${name}. Please choose a delivery address in a country supported by the store, or contact the store.`, 422, "address");
  }
  if (!project.currencies.includes(currency)) {
    throw new CheckoutServiceError("configuration", "CURRENCY_UNSUPPORTED", "The selected currency is not supported by the store. Please contact the store.", 422);
  }
}
