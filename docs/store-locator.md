# Store locator

The storefront reads Store records from commercetools and displays them at `/stores`. Store details are managed in Merchant Center; the storefront does not create, edit, or delete Store records.

## Configure the Store custom fields

The commercetools Store resource does not include physical address, phone, description, or map coordinates. Add these fields to a Custom Type for the **Store** resource:

| Field name | Type | Example |
| --- | --- | --- |
| `description` | String | Visit our Sydney store for the latest collection and local advice. |
| `address` | String | Shop 3, 1 Martin Place, Sydney NSW 2000, Australia |
| `phone` | String | +61 2 5550 0101 |
| `latitude` | Number | -33.8688 |
| `longitude` | Number | 151.2093 |

Create the `store-locator` Type and its fields by running this command from the storefront repository root:

```sh
npm run store-locator:setup
```

The script reads `CT_PROJECT_KEY`, `CT_AUTH_URL`, and `CT_API_URL` from `.env.local` or `.env` (`.env.local` takes precedence). For credentials, it uses `CT_TYPES_CLIENT_ID` and `CT_TYPES_CLIENT_SECRET` when both are set; otherwise, it falls back to `CT_CLIENT_ID` and `CT_CLIENT_SECRET`. Prefer a dedicated API client with only the `manage_types` scope for this setup, and put its credentials in the `CT_TYPES_*` variables so other local features keep using the existing client. The script creates the Type if it is missing, reports success if the existing Type has the required Store fields, and stops without changing an incompatible Type. Then create or edit Store records in Merchant Center and attach this Type with the relevant values.

The API client configured for the storefront must be able to read Stores. The existing server-side commercetools client is used; credentials remain on the server.

## Demo locations

For a quick Merchant Center setup, create two Store records and add the custom fields:

| Store key | Name | Address | Phone | Latitude | Longitude |
| --- | --- | --- | --- | ---: | ---: |
| `sydney-flagship` | Sydney Flagship | Shop 3, 1 Martin Place, Sydney NSW 2000, Australia | +61 2 5550 0101 | -33.8688 | 151.2093 |
| `melbourne-victoria` | Melbourne, Victoria | Shop 12, 234 Collins Street, Melbourne VIC 3000, Australia | +61 3 5550 0102 | -37.8136 | 144.9631 |

The app shows these two sample locations only when no commercetools credentials are configured. Once credentials are configured, the locator uses the Store records in the project. Records without coordinates still appear in the list and details page, but their map shows a message that coordinates are missing.

The map uses OpenStreetMap embeds and does not require a map API key.
