# Product Labels — commercetools Merchant Center Custom Application

A Merchant Center Custom Application for creating, scheduling, styling, and targeting product labels (badges) rendered on product images across storefront `ProductCard` components.

## Features

- **Dedicated Merchant Center Menu**: Adds **Product Labels** (`All Labels` + `Create Label`) in the Merchant Center navigation (`entryPointUriPath: product-labels`).
- **Label Text & Schedule**: Configure badge text, internal name, priority, active toggle, optional start date/time, and optional end date/time.
- **Image Corner Position**: Place badges at `Top left`, `Top right`, `Bottom left`, or `Bottom right` of product card images (multiple active labels stack cleanly per corner).
- **Custom CSS + Live Preview**: Style badges using raw CSS declarations (plus quick presets) with a live `ProductCard` preview and CSS sanitization.
- **Flexible Product Targeting**:
  - Specific catalog products (picker + manual ID/key entry)
  - Shared product attribute rule (`equals`, `contains`, `in`) populated from project Product Types
  - Combined (`both`)

## Shared Storage

Configurations are stored in commercetools **Custom Objects** under container `product-labels` so the Merchant Center app and the Next.js storefront read and write the exact same source of truth with zero extra database setup.

## Local Development

```bash
cd mc-product-labels
npm install
npm start
```

Open Merchant Center local login using the URL printed by `mc-scripts start` (`cloudIdentifier: gcp-au`, project key `namnx-051026`).

## Checks & Production Build

```bash
cd mc-product-labels
npm run typecheck
npm run lint
npm test
npm run build
```

## Registering in commercetools Merchant Center

1. In Merchant Center, go to **Organization & settings → Custom Applications → Add a Custom Application**.
2. Set:
   - **Name**: `Product Labels`
   - **Entry point URI path**: `product-labels`
   - **Application URL**: your hosted HTTPS URL after deploying `npm run build`
   - **OAuth Scopes**: `view_key_value_documents`, `view_products`, `manage_key_value_documents`
3. Install the Custom Application in project `namnx-051026` and grant team permissions to view/manage **Product Labels**.
