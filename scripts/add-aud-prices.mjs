import dotenv from "dotenv";
import { ClientBuilder } from "@commercetools/sdk-client-v2";
import { createApiBuilderFromCtpClient } from "@commercetools/platform-sdk";

dotenv.config({ path: ".env.local", quiet: true });

const RATE = 1.8;
const SOURCE_CURRENCY = "EUR";
const TARGET_CURRENCY = "AUD";
const apply = process.argv.includes("--apply");

const { CT_PROJECT_KEY: projectKey, CT_AUTH_URL: authUrl, CT_API_URL: apiUrl, CT_CLIENT_ID: clientId, CT_CLIENT_SECRET: clientSecret } = process.env;

if (!projectKey || !authUrl || !apiUrl || !clientId || !clientSecret) {
  throw new Error("Missing commercetools credentials in .env.local.");
}

const client = new ClientBuilder()
  .withClientCredentialsFlow({
    host: authUrl,
    projectKey,
    credentials: { clientId, clientSecret },
    scopes: [`manage_project:${projectKey}`],
  })
  .withHttpMiddleware({ host: apiUrl })
  .build();

const apiRoot = createApiBuilderFromCtpClient(client).withProjectKey({ projectKey });

function priceScopeKey(price) {
  return JSON.stringify({
    country: price.country,
    customerGroup: price.customerGroup?.id,
    channel: price.channel?.id,
    validFrom: price.validFrom,
    validUntil: price.validUntil,
    recurrencePolicy: price.recurrencePolicy?.id,
  });
}

function convertMoney(value) {
  if (value.type === "highPrecision") {
    return {
      type: "highPrecision",
      currencyCode: TARGET_CURRENCY,
      centAmount: Math.round(value.centAmount * RATE),
      preciseAmount: Math.round(value.preciseAmount * RATE),
      fractionDigits: value.fractionDigits,
    };
  }

  return {
    currencyCode: TARGET_CURRENCY,
    centAmount: Math.round(value.centAmount * RATE),
  };
}

function priceDraft(price) {
  return {
    value: convertMoney(price.value),
    ...(price.country ? { country: price.country } : {}),
    ...(price.customerGroup ? { customerGroup: { id: price.customerGroup.id } } : {}),
    ...(price.channel ? { channel: { id: price.channel.id } } : {}),
    ...(price.validFrom ? { validFrom: price.validFrom } : {}),
    ...(price.validUntil ? { validUntil: price.validUntil } : {}),
    ...(price.recurrencePolicy ? { recurrencePolicy: { id: price.recurrencePolicy.id } } : {}),
  };
}

async function getAllProducts() {
  const products = [];
  let offset = 0;

  while (true) {
    const response = await apiRoot.products().get({ queryArgs: { limit: 500, offset, withTotal: false } }).execute();
    products.push(...response.body.results);
    if (response.body.results.length < 500) return products;
    offset += response.body.results.length;
  }
}

const products = await getAllProducts();
const summary = { products: products.length, variants: 0, pricesToAdd: 0, existingAudPrices: 0, missingEurPrices: 0, unpublishedProducts: 0, updatedProducts: 0 };

for (const product of products) {
  const current = product.masterData.current;
  if (!current) {
    summary.unpublishedProducts += 1;
    continue;
  }

  const variants = [current.masterVariant, ...current.variants];
  const actions = [];

  for (const variant of variants) {
    summary.variants += 1;
    const prices = variant.prices ?? [];
    const audScopes = new Set(prices.filter((price) => price.value.currencyCode === TARGET_CURRENCY).map(priceScopeKey));
    const eurPrices = prices.filter((price) => price.value.currencyCode === SOURCE_CURRENCY);

    if (eurPrices.length === 0) {
      summary.missingEurPrices += 1;
      continue;
    }

    for (const eurPrice of eurPrices) {
      const scope = priceScopeKey(eurPrice);
      if (audScopes.has(scope)) {
        summary.existingAudPrices += 1;
        continue;
      }

      actions.push({ action: "addPrice", variantId: variant.id, price: priceDraft(eurPrice), staged: false });
      summary.pricesToAdd += 1;
      audScopes.add(scope);
    }
  }

  if (actions.length === 0 || !apply) continue;
  await apiRoot.products().withId({ ID: product.id }).post({ body: { version: product.version, actions } }).execute();
  summary.updatedProducts += 1;
}

console.log(JSON.stringify({ mode: apply ? "applied" : "dry-run", rate: `1 ${SOURCE_CURRENCY} = ${RATE} ${TARGET_CURRENCY}`, ...summary }, null, 2));

if (!apply && summary.pricesToAdd > 0) {
  console.log("Run npm run prices:add-aud -- --apply to create the AUD prices.");
}
