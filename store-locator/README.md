# Store Locator Custom Application

This Merchant Center Custom Application lists commercetools Stores and lets users
create, edit, and delete them. The form manages the `description`, `address`,
`phone`, `latitude`, and `longitude` Store custom fields used by the storefront
locator.

## One-time Store Type setup

Store locator fields require the `store-locator` Custom Type on the Store
resource. From the storefront repository root, configure the required
`CT_*` credentials and run:

```sh
npm run store-locator:setup
```

The script uses the project's existing commercetools SDK dependencies and the
`manage_types` API scope, loading credentials from `.env.local` or `.env`.
It creates the Type if missing, is safe to rerun when
the schema already matches, and stops without changing an incompatible Type.

The application checks the Type schema and disables Store creation or editing
until all five fields have the expected types. It does not replace a Store's
other Custom Type.

## Local development

Use the Node.js version in `.nvmrc` (with nvm) and Corepack:

```sh
nvm install
nvm use
corepack pnpm install
corepack pnpm start
```

The app uses the Merchant Center OAuth scopes `view_stores`, `manage_stores`,
and `view_types`. Vercel is configured to serve the app as a single-page
application. Before deploying, set `env.production.url` in
`custom-application-config.mjs` to the stable production domain; it must match
the URL registered in Merchant Center.
