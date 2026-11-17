# Customer account

The storefront now uses real commercetools Customers, customer OAuth sessions,
Shopping Lists and Orders. Account operations do not have a demo-success fallback.
The interface follows the existing English storefront.

## Environment configuration

Keep the existing server credentials (`CT_PROJECT_KEY`, `CT_AUTH_URL`, `CT_API_URL`,
`CT_CLIENT_ID`, `CT_CLIENT_SECRET`) in `.env.local`. Add:

```dotenv
# A separate customer API client in the same commercetools project.
CT_CUSTOMER_CLIENT_ID=your-customer-client-id
CT_CUSTOMER_CLIENT_SECRET=your-customer-client-secret

# A Resend API key and a sender on your verified Resend domain.
RESEND_API_KEY=re_your_key
RESEND_FROM_EMAIL=NamNX <no-reply@your-verified-domain.com>

# Trusted public origin used to generate password-reset links.
APP_URL=http://localhost:3000
# Production must use HTTPS, e.g. https://shop.example.com
```

In Merchant Center, create the customer API client with these scopes, replacing
`PROJECT_KEY` with the same project key as the storefront:

```text
manage_my_profile:PROJECT_KEY
manage_my_orders:PROJECT_KEY
manage_my_shopping_lists:PROJECT_KEY
view_published_products:PROJECT_KEY
```

Do not use the existing `manage_project` client as the customer client. It cannot
request a token with lesser scopes. Customer login rejects tokens containing
project-wide permissions. No credentials above should have a `NEXT_PUBLIC_` prefix.
Restart the Next.js server after changing environment variables.

The existing server client is used for registration, password-reset tokens,
uniquely keyed wishlist creation and expanded order reads. The order read first
checks `/me/orders/{id}` and verifies `customerId` before reading payment/state/
discount references, then checks ownership again on the expanded response.
For a deployment that replaces the demo's broad server client, grant the relevant
customer, shopping-list, order, payment, state and discount-code permissions as
well as the catalog/checkout permissions needed by the rest of the existing app.

## Pages and behavior

| Route | Behavior |
| --- | --- |
| `/account` | Redirect to profile or sign in |
| `/account/login` | Email/password sign in |
| `/account/register` | First/last name, email, password, address and phone; sign in after successful registration |
| `/account/forgot-password` | Send a Resend reset link without disclosing whether an email exists |
| `/account/reset-password?token=...` | Set a new password using a 30-minute, single-use commercetools token |
| `/account/profile` | Edit names and date of birth; link to address editing |
| `/account/password` | Change password after verifying the current password; sign in again |
| `/account/addresses` | Add/edit/remove addresses; choose default shipping/billing |
| `/account/wishlist` | View favorites, edit quantities, remove products |
| `/account/orders` | Paginated customer orders, payment and shipping status |
| `/account/orders/{id}` | Ordered items, prices/tax/discounts, addresses, deliveries/parcels/tracking, payment transactions and returns |

Product cards and product details have a Save to wishlist button. Guests are sent
to sign in and returned to their original page; they can then save the product.
Favorites use one Shopping List keyed `wishlist-{customerId}`; repeated saves of
the same variant do not increase the quantity. Only published catalog products,
not fallback demo products, can be saved. Concurrent edits use resource versions;
a conflict asks the customer to refresh instead of overwriting newer changes.

Customer sessions are held in HttpOnly, SameSite=Lax cookies, Secure in production,
with a browser lifetime of at most one hour. Customer API reads bypass caching.
Logout clears the cookie and attempts token revocation. Password reset invalidates
prior password-flow tokens in commercetools (eventually consistent). No access or
refresh token is exposed to browser JavaScript or localStorage. Automatic token
refresh is not implemented; customers sign in again when the session expires.

Checkout derives `customerId`, email and saved addresses from the authenticated
session. Expired sessions must sign in again rather than silently ordering as a
guest. Previously placed guest orders are not automatically assigned to an account,
and orders matched only by email are not exposed. Shipping states and tracking
are displayed as stored in commercetools; the app does not contact carriers or
invent tracking information. Missing fulfillment/payment fields have empty states.
The implementation supports global customers, not Store-specific authentication.

The profile's phone is stored on commercetools Address records, since Customer has
no standard top-level phone field. Order data stays server-rendered; internal
customer password fields, API credentials and raw payment custom fields are never
sent as account form props.

## Resend

Verify the sending domain in Resend and use an authorized From address. Restricted
Resend test domains may only deliver to the account owner's email. Password-reset
links always use `APP_URL`, never request Host/Origin headers. Tokens are not
returned to the requester or logged; SDK errors are sanitized. Email-provider
failures produce a generic public reset response and a sanitized server log.

Local per-identity attempt limits protect sign-in/reset/registration/password
changes. They are in process memory and reset on restart. Before running multiple
instances in production, add shared rate limiting at your gateway or Redis-backed
limiter, including limits by trusted client IP. This demo limiter is not a
cross-instance abuse prevention system.

## Verification

```sh
npm run test:account
npx tsc --noEmit
npx eslint src/lib/account src/components/account src/app/account src/components/site/ProductCard.tsx 'src/app/products/[slug]/page.tsx' src/app/api/checkout/session/route.ts
npm run build -- --webpack
```

The test suite uses the real TypeScript logic with mocked framework/network edges;
it never creates real customers, modifies Merchant Center data or sends emails.
It covers validation, redirects, ownership boundaries, version conflicts, resets,
session cookie restrictions/revocation, Resend requests and checkout identity.
Webpack is a validation fallback if the execution environment blocks Turbopack's
internal port binding. The normal build script remains unchanged.

After configuring credentials, verify with a dedicated test customer:

1. Register, sign in, reload the page and confirm the session remains active.
2. Edit names/birthday; add/edit/remove addresses and select defaults.
3. Add a catalog product to the wishlist; edit its quantity and remove it.
4. Request a reset email, use the link, confirm old/reused links fail, then sign in
   with the new password. Change the password from the account page as well.
5. Place a test checkout order. Verify its `customerId` in Merchant Center, then
   check order history/detail, including Merchant Center shipping/tracking updates.
6. Sign in with a second test customer and verify the first customer's order URL
   is not accessible. Log out and confirm protected pages redirect to sign in.

The checked-in implementation has not been exercised against live customer OAuth
or Resend credentials: the required customer-client and Resend variables were not
present during development.

## Workspace note

This directory is ignored by the enclosing Git repository (`/data/www/*`) and has
no `.git` directory of its own. Files are written to the workspace, but the parent
repository's `git diff` does not include them. No commit or parent Git ignore
change was made. GitNexus was unavailable; direct dependency analysis was used
with the user's explicit approval.

## API references

- [Customer authentication and revocation](https://docs.commercetools.com/api/authorization)
- [Customer scopes](https://docs.commercetools.com/api/scopes)
- [Customer password reset](https://docs.commercetools.com/api/projects/customers)
- [Resend idempotency](https://resend.com/changelog/idempotency-keys)

## Checkout destination troubleshooting

Checkout uses the signed-in customer's default shipping address, falling back to
its first saved address. It does not replace that address with the guest demo
address. Before creating the cart, the API verifies that the destination country
and currency are configured in the project. Unsupported destinations return HTTP
422 with `DELIVERY_COUNTRY_UNSUPPORTED`; the checkout UI links to the address book.
Provider errors for missing tax rates, missing prices and shipping availability
also return actionable messages. Server logs contain only a stage and sanitized
error code, never the upstream response body or customer information.

During troubleshooting, a temporary cart for VN was rejected; a cart and Checkout
session for US/USD both succeeded. The temporary US cart was deleted without
placing an order or making a payment. At the time of the check, VN was not in the
project's configured countries and had no shipping zone or tax rate. To support
Vietnam, configure the intended market, matching product prices, tax rates and
shipping zone/rates in Merchant Center. Do not substitute an unrelated delivery
country or invent tax rates just to suppress the error. A supported US delivery
address can be used to continue testing the existing USD demo.
