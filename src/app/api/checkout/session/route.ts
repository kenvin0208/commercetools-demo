import { NextResponse } from "next/server";
import { getMarket } from "@/src/lib/market";
import { currentCustomer, hasCustomerSession } from "@/src/lib/account/session";
import { customerCartFields } from "@/src/lib/account/checkout";
import { CheckoutServiceError, checkoutResponse, validateCheckoutMarket, type CheckoutStage } from "@/src/lib/checkout/errors";
import type { Customer } from "@commercetools/platform-sdk";

const normalizeHost = (value: string | undefined) => (value || "").replace(/\/+$/, "");
const ORDER_NUMBER_CONTAINER = "storefront-order-numbers";
const ORDER_NUMBER_KEY = "sequence";
const MAX_ORDER_NUMBER_ATTEMPTS = 40;

async function getAccessToken() {
  const token = process.env.CT_ACCESS_TOKEN;
  if (token) return token;

  const projectKey = process.env.CT_PROJECT_KEY;
  const clientId = process.env.CT_CLIENT_ID;
  const clientSecret = process.env.CT_CLIENT_SECRET;
  const authHost = normalizeHost(process.env.CT_AUTH_URL);

  if (!projectKey || !clientId || !clientSecret || !authHost) {
    throw new CheckoutServiceError("authentication", "MISSING_CONFIGURATION", "Checkout is not configured yet. Please contact the store.", 503);
  }

  const scope = `manage_project:${projectKey}`;
  const response = await fetch(`${authHost}/oauth/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      scope,
    }).toString(),
  });

  const data = await checkoutResponse<{ access_token?: string }>(response, "authentication");

  if (!data.access_token) {
    throw new Error("CommerceTools token response did not include an access token.");
  }

  return data.access_token;
}

type CheckoutLineItem = {
  productId: string;
  variantId?: number;
  quantity: number;
};

async function createCart(accessToken: string, lineItems: CheckoutLineItem[], currency: string, country: string, storeKey: string, customer: Customer | null = null) {
  const projectKey = process.env.CT_PROJECT_KEY;
  const apiHost = normalizeHost(process.env.CT_API_URL);

  if (!projectKey || !apiHost) {
    throw new CheckoutServiceError("configuration", "MISSING_CONFIGURATION", "Checkout is not configured yet. Please contact the store.", 503);
  }

  const customerFields = customer ? customerCartFields(customer, country) : undefined;
  const projectResponse = await fetch(`${apiHost}/${projectKey}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store", signal: AbortSignal.timeout(15000),
  });
  const project = await checkoutResponse<{ countries: string[]; currencies: string[] }>(projectResponse, "configuration");
  validateCheckoutMarket(project, customerFields?.country ?? country, currency);

  const cartEndpoint = storeKey ? `${apiHost}/${projectKey}/in-store/key=${encodeURIComponent(storeKey)}/carts` : `${apiHost}/${projectKey}/carts`;
  const response = await fetch(cartEndpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      currency,
      country,
      customerEmail: "guest-checkout@example.com",
      shippingAddress: {
        country,
        firstName: "Guest",
        lastName: "Checkout",
        streetName: country === "US" ? "Main Street" : (country === "DE" ? "Hauptstraße" : (country === "GB" ? "Oxford Street" : "George Street")),
        streetNumber: "1",
        city: country === "US" ? "New York" : (country === "DE" ? "Berlin" : (country === "GB" ? "London" : "Sydney")),
        postalCode: country === "US" ? "10001" : (country === "DE" ? "10115" : (country === "GB" ? "W1U 3BW" : "2000")),
        state: country === "US" ? "NY" : undefined,
        phone: "0123456789",
        email: "guest-checkout@example.com",
      },
      billingAddress: {
        country,
        firstName: "Guest",
        lastName: "Checkout",
        streetName: country === "US" ? "Main Street" : (country === "DE" ? "Hauptstraße" : (country === "GB" ? "Oxford Street" : "George Street")),
        streetNumber: "1",
        city: country === "US" ? "New York" : (country === "DE" ? "Berlin" : (country === "GB" ? "London" : "Sydney")),
        postalCode: country === "US" ? "10001" : (country === "DE" ? "10115" : (country === "GB" ? "W1U 3BW" : "2000")),
        state: country === "US" ? "NY" : undefined,
        phone: "0123456789",
        email: "guest-checkout@example.com",
      },
      ...customerFields,
      lineItems: lineItems.map((lineItem) => ({
        productId: lineItem.productId,
        variantId: lineItem.variantId ?? 1,
        quantity: lineItem.quantity,
      })),
      shippingMethod: {
        key: "standard-shipping",
      },
    }),
  });

  const data = await checkoutResponse<{ id?: string }>(response, "cart");

  if (!data.id) {
    throw new Error("CommerceTools cart creation did not return an id.");
  }

  return data.id;
}

function formatOrderNumberDate(date: Date) {
  return [
    String(date.getUTCFullYear()).slice(-2),
    String(date.getUTCMonth() + 1).padStart(2, "0"),
    String(date.getUTCDate()).padStart(2, "0"),
    String(date.getUTCHours()).padStart(2, "0"),
    String(date.getUTCMinutes()).padStart(2, "0"),
  ].join("");
}

async function allocateOrderNumber(accessToken: string) {
  const projectKey = process.env.CT_PROJECT_KEY;
  const apiHost = normalizeHost(process.env.CT_API_URL);

  if (!projectKey || !apiHost) {
    throw new CheckoutServiceError("configuration", "MISSING_CONFIGURATION", "Checkout is not configured yet. Please contact the store.", 503);
  }

  const datePrefix = formatOrderNumberDate(new Date());
  const customObjectUrl = `${apiHost}/${projectKey}/custom-objects`;
  const counterUrl = `${customObjectUrl}/${encodeURIComponent(ORDER_NUMBER_CONTAINER)}/${encodeURIComponent(ORDER_NUMBER_KEY)}`;
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
  };

  for (let attempt = 0; attempt < MAX_ORDER_NUMBER_ATTEMPTS; attempt += 1) {
    const counterResponse = await fetch(counterUrl, {
      headers,
      cache: "no-store",
      signal: AbortSignal.timeout(15000),
    });

    let nextIndex: number;
    let writeResponse: Response;

    if (counterResponse.status === 404) {
      nextIndex = 1;
      writeResponse = await fetch(customObjectUrl, {
        method: "POST",
        headers,
        body: JSON.stringify({
          container: ORDER_NUMBER_CONTAINER,
          key: ORDER_NUMBER_KEY,
          value: { lastIndex: nextIndex },
        }),
        signal: AbortSignal.timeout(15000),
      });
    } else {
      const counter = await checkoutResponse<{ version: number; value: unknown }>(counterResponse, "session");
      const value = counter.value;

      if (
        typeof value !== "object" ||
        value === null ||
        !("lastIndex" in value) ||
        typeof value.lastIndex !== "number" ||
        !Number.isSafeInteger(value.lastIndex) ||
        value.lastIndex < 1
      ) {
        throw new Error("The stored order number counter is invalid.");
      }

      nextIndex = value.lastIndex + 1;
      if (!Number.isSafeInteger(nextIndex)) {
        throw new Error("The order number counter has reached its safe integer limit.");
      }

      writeResponse = await fetch(customObjectUrl, {
        method: "POST",
        headers,
        body: JSON.stringify({
          container: ORDER_NUMBER_CONTAINER,
          key: ORDER_NUMBER_KEY,
          version: counter.version,
          value: { lastIndex: nextIndex },
        }),
        signal: AbortSignal.timeout(15000),
      });
    }

    if (writeResponse.status === 409) {
      await writeResponse.body?.cancel();
      const backoffMs = Math.min(10 * 2 ** attempt, 250) + Math.floor(Math.random() * 25);
      await new Promise((resolve) => setTimeout(resolve, backoffMs));
      continue;
    }

    await checkoutResponse<{ version: number }>(writeResponse, "session");
    return `ORD-${datePrefix}${String(nextIndex).padStart(3, "0")}`;
  }

  throw new CheckoutServiceError(
    "session",
    "ORDER_NUMBER_ALLOCATION_FAILED",
    "Could not reserve a unique order number. Please retry checkout.",
    503,
  );
}

async function createCheckoutSession(accessToken: string, cartId: string) {
  const projectKey = process.env.CT_PROJECT_KEY;
  const applicationKey = process.env.CT_APPLICATION_KEY;
  const region = process.env.NEXT_PUBLIC_CT_REGION ?? process.env.CT_REGION ?? "australia-southeast1.gcp";

  if (!projectKey || !applicationKey) {
    throw new CheckoutServiceError("session", "MISSING_CONFIGURATION", "Checkout is not configured yet. Please contact the store.", 503);
  }

  const futureOrderNumber = await allocateOrderNumber(accessToken);
  const sessionHost = `https://session.${region}.commercetools.com`;
  const response = await fetch(`${sessionHost}/${projectKey}/sessions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      cart: {
        cartRef: {
          id: cartId,
        },
      },
      metadata: {
        applicationKey,
        futureOrderNumber,
      },
    }),
  });

  const data = await checkoutResponse<{ id?: string }>(response, "session");

  if (!data.id) {
    throw new Error("Checkout session response did not include an id.");
  }

  return data.id;
}

export async function POST(request: Request) {
  let stage: CheckoutStage = "customer";
  try {
    const origin = request.headers.get("origin");
    if (!origin || origin !== new URL(request.url).origin) {
      return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
    }
    const customer = await currentCustomer();
    if (!customer && await hasCustomerSession()) {
      return NextResponse.json({ error: "Your session has expired. Please sign in again before checkout.", recovery: "login" }, { status: 401 });
    }
    const body = (await request.json()) as {
      items?: CheckoutLineItem[],
      market?: string
    };
    const lineItems = body.items ?? [];
    const marketCode = body.market === "US" ? "US" : body.market === "AU" ? "AU" : null;
    if (!marketCode) return NextResponse.json({ error: "Invalid checkout market." }, { status: 400 });
    const marketConfig = getMarket(marketCode);
    const { currency, country, storeKey } = marketConfig;

    if (!Array.isArray(lineItems) || lineItems.length > 100 || typeof currency !== "string" || !/^[A-Z]{3}$/.test(currency) || typeof country !== "string" || !/^[A-Z]{2}$/.test(country)) {
      return NextResponse.json({ error: "Invalid checkout information." }, { status: 400 });
    }
    if (lineItems.some(item => !item || !Number.isSafeInteger(item.quantity) || item.quantity < 1 || item.quantity > 999 || (item.variantId !== undefined && (!Number.isSafeInteger(item.variantId) || item.variantId < 1)))) {
      return NextResponse.json({ error: "Invalid item quantity or variant." }, { status: 400 });
    }
    if (lineItems.length === 0) {
      return NextResponse.json({ error: "Cannot create a Checkout session for an empty cart." }, { status: 400 });
    }

    const invalidLineItem = lineItems.find((item) => !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(item.productId));

    if (invalidLineItem) {
      return NextResponse.json(
        {
          error: `Product "${invalidLineItem.productId}" is a demo/fallback product id, not a valid commercetools product UUID. Please use products loaded from commercetools before checkout.`,
        },
        { status: 400 }
      );
    }

    stage = "authentication";
    const accessToken = await getAccessToken();
    stage = "cart";
    const cartId = await createCart(accessToken, lineItems, currency, country, storeKey, customer);
    stage = "session";
    const sessionId = await createCheckoutSession(accessToken, cartId);

    return NextResponse.json({
      sessionId,
      cartId,
      projectKey: process.env.CT_PROJECT_KEY,
      region: process.env.NEXT_PUBLIC_CT_REGION ?? process.env.CT_REGION ?? "australia-southeast1.gcp",
    });
  } catch (error) {
    if (error instanceof CheckoutServiceError) {
      console.error("[checkout]", { stage: error.stage, code: error.code, status: error.status });
      return NextResponse.json({ error: error.message, code: error.code, recovery: error.recovery }, { status: error.status });
    }
    if (error instanceof SyntaxError) return NextResponse.json({ error: "Invalid checkout request." }, { status: 400 });
    console.error("[checkout]", { stage, code: "UNEXPECTED_FAILURE" });
    return NextResponse.json({ error: "Unable to create checkout session. Please try again." }, { status: 502 });
  }
}
