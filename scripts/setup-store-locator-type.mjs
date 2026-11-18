import dotenv from "dotenv";
import { ClientBuilder } from "@commercetools/sdk-client-v2";
import { createApiBuilderFromCtpClient } from "@commercetools/platform-sdk";

dotenv.config({ path: [".env.local", ".env"], quiet: true });

const TYPE_KEY = "store-locator";
const RESOURCE_TYPE_ID = "store";
const fields = [
  { name: "description", label: "Description", type: "String" },
  { name: "address", label: "Address", type: "String" },
  { name: "phone", label: "Phone", type: "String" },
  { name: "latitude", label: "Latitude", type: "Number" },
  { name: "longitude", label: "Longitude", type: "Number" },
];

const {
  CT_PROJECT_KEY: projectKey,
  CT_AUTH_URL: authUrl,
  CT_API_URL: apiUrl,
  CT_CLIENT_ID: clientId,
  CT_CLIENT_SECRET: clientSecret,
} = process.env;

if (!projectKey || !authUrl || !apiUrl || !clientId || !clientSecret) {
  throw new Error(
    "Missing commercetools credentials. Set CT_PROJECT_KEY, CT_AUTH_URL, CT_API_URL, CT_CLIENT_ID, and CT_CLIENT_SECRET in .env.local."
  );
}

const client = new ClientBuilder()
  .withClientCredentialsFlow({
    host: authUrl,
    projectKey,
    credentials: { clientId, clientSecret },
    scopes: [`manage_types:${projectKey}`],
  })
  .withHttpMiddleware({ host: apiUrl })
  .build();

const apiRoot = createApiBuilderFromCtpClient(client).withProjectKey({
  projectKey,
});

const typeDraft = {
  key: TYPE_KEY,
  name: { en: "Store Locator" },
  description: { en: "Address and map details for Store Locator." },
  resourceTypeIds: [RESOURCE_TYPE_ID],
  fieldDefinitions: fields.map(({ name, label, type }) => ({
    name,
    label: { en: label },
    required: false,
    type: { name: type },
  })),
};

const existingTypes = await apiRoot
  .types()
  .get({ queryArgs: { where: `key="${TYPE_KEY}"`, limit: 1 } })
  .execute();
const existingType = existingTypes.body.results[0];

if (existingType) {
  const missingStoreResource = !existingType.resourceTypeIds.includes(
    RESOURCE_TYPE_ID
  );
  const incompatibleFields = fields.flatMap((field) => {
    const existingField = existingType.fieldDefinitions.find(
      ({ name }) => name === field.name
    );

    if (!existingField) return [`${field.name} (missing)`];
    if (existingField.type.name !== field.type) {
      return [
        `${field.name} (expected ${field.type}, found ${existingField.type.name})`,
      ];
    }

    return [];
  });

  if (missingStoreResource || incompatibleFields.length > 0) {
    const problems = [
      ...(missingStoreResource ? ['resource type "store" is missing'] : []),
      ...incompatibleFields,
    ];
    throw new Error(
      `Type "${TYPE_KEY}" already exists but is incompatible: ${problems.join(
        ", "
      )}. Update it in Merchant Center before continuing.`
    );
  }

  console.log(
    JSON.stringify({ status: "already-ready", projectKey, typeKey: TYPE_KEY })
  );
} else {
  await apiRoot.types().post({ body: typeDraft }).execute();
  console.log(JSON.stringify({ status: "created", projectKey, typeKey: TYPE_KEY }));
}
