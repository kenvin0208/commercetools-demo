import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { ClientBuilder } from "@commercetools/sdk-client-v2";
import { createApiBuilderFromCtpClient } from "@commercetools/platform-sdk";
import { AccountInputError, statusCode } from "./validation";

const SESSION_COOKIE = process.env.NODE_ENV === "production" ? "__Host-customer-session" : "customer-session";

function configuration() {
  const { CT_PROJECT_KEY: projectKey, CT_AUTH_URL: authUrl, CT_API_URL: apiUrl } = process.env;
  const clientId = process.env.CT_CUSTOMER_CLIENT_ID;
  const clientSecret = process.env.CT_CUSTOMER_CLIENT_SECRET;
  if (!projectKey || !authUrl || !apiUrl || !clientId || !clientSecret) throw new Error("Customer authentication is not configured.");
  return { projectKey, authUrl: authUrl.replace(/\/+$/, ""), apiUrl: apiUrl.replace(/\/+$/, ""), clientId, clientSecret };
}

export async function startCustomerSession(email: string, password: string) {
  const config = configuration();
  const response = await fetch(`${config.authUrl}/oauth/${encodeURIComponent(config.projectKey)}/customers/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${config.clientId}:${config.clientSecret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ grant_type: "password", username: email, password,
      scope: ["manage_my_profile", "manage_my_orders", "manage_my_shopping_lists", "view_published_products"].map(scope => `${scope}:${config.projectKey}`).join(" "),
    }),
    cache: "no-store",
    signal: AbortSignal.timeout(15000),
  });
  if (response.status === 400 || response.status === 401) throw new AccountInputError("Unable to sign in with this email and password.");
  if (!response.ok) throw new Error("Customer authentication failed.");
  const token = await response.json() as { access_token: string; expires_in: number; scope?: string };
  if (!token.access_token || !Number.isFinite(token.expires_in)) throw new Error("Invalid authentication response.");
  // Never put a project-wide access token in a customer session cookie.
  const scopes = token.scope?.split(" ") ?? [];
  const allowed = new Set(["manage_my_profile", "manage_my_orders", "manage_my_shopping_lists", "view_published_products"].map(scope => `${scope}:${config.projectKey}`));
  if (!scopes.some(scope => scope.startsWith("customer_id:")) || scopes.some(scope => !allowed.has(scope) && !scope.startsWith("customer_id:"))) {
    throw new Error("Customer API client must only grant the configured customer scopes.");
  }
  (await cookies()).set(SESSION_COOKIE, token.access_token, {
    httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/",
    maxAge: Math.min(token.expires_in, 60 * 60),
  });
}

export async function clearCustomerSession() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  store.delete(SESSION_COOKIE);
  if (token) {
    try {
      const config = configuration();
      const response = await fetch(`${config.authUrl}/oauth/token/revoke`, {
        method: "POST",
        headers: { Authorization: `Basic ${Buffer.from(`${config.clientId}:${config.clientSecret}`).toString("base64")}`, "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ token, token_type_hint: "access_token" }),
        cache: "no-store", signal: AbortSignal.timeout(5000),
      });
      if (!response.ok) console.error("Customer token revocation failed; the local session has been cleared.");
    } catch { console.error("Customer token revocation unavailable; the local session has been cleared."); }
  }
}

export async function hasCustomerSession() {
  return (await cookies()).has(SESSION_COOKIE);
}

export async function customerApi() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) throw Object.assign(new Error("Authentication required."), { statusCode: 401 });
  const config = configuration();
  const client = new ClientBuilder().withExistingTokenFlow(`Bearer ${token}`, { force: true })
    .withHttpMiddleware({ host: config.apiUrl, fetch: (input: RequestInfo | URL, init?: RequestInit) => fetch(input, { ...init, cache: "no-store" }) }).build();
  return createApiBuilderFromCtpClient(client).withProjectKey({ projectKey: config.projectKey }).me();
}

export const currentCustomer = cache(async () => {
  if (!(await cookies()).has(SESSION_COOKIE)) return null;
  try {
    return (await (await customerApi()).get().execute()).body;
  } catch (error) {
    if (statusCode(error) === 401 || statusCode(error) === 404) return null;
    throw new Error("The account service is temporarily unavailable.");
  }
});

export async function requireCustomer() {
  const customer = await currentCustomer();
  if (!customer) redirect("/account/login");
  return customer;
}
