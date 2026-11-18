import "server-only";
import type { FieldContainer } from "@commercetools/platform-sdk";
import { apiRoot, hasCtpCredentials } from "@/src/lib/commercetools/client";
import { getLocalizedValue } from "@/src/utils/localized";

export type StoreLocation = {
  key: string;
  name: string;
  description: string;
  address: string;
  phone: string;
  latitude?: number;
  longitude?: number;
};

const demoStores: StoreLocation[] = [
  {
    key: "sydney-flagship",
    name: "Sydney Flagship",
    description: "Discover our latest collections and speak with our team at our Sydney city store.",
    address: "Shop 3, 1 Martin Place, Sydney NSW 2000, Australia",
    phone: "+61 2 5550 0101",
    latitude: -33.8688,
    longitude: 151.2093,
  },
  {
    key: "melbourne-victoria",
    name: "Melbourne, Victoria",
    description: "Visit our Melbourne store for considered homewares, furniture and friendly local advice.",
    address: "Shop 12, 234 Collins Street, Melbourne VIC 3000, Australia",
    phone: "+61 3 5550 0102",
    latitude: -37.8136,
    longitude: 144.9631,
  },
];

const commercetoolsEnvNames = [
  "CT_PROJECT_KEY",
  "CT_AUTH_URL",
  "CT_API_URL",
  "CT_CLIENT_ID",
  "CT_CLIENT_SECRET",
] as const;

function getStringField(fields: FieldContainer, name: string): string {
  const value = fields[name];
  return typeof value === "string" ? value : "";
}

function getCoordinate(fields: FieldContainer, name: string, min: number, max: number): number | undefined {
  const value = fields[name];
  const coordinate = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
  return Number.isFinite(coordinate) && coordinate >= min && coordinate <= max ? coordinate : undefined;
}

export async function getStores(): Promise<StoreLocation[]> {
  const hasAnyCredentials = commercetoolsEnvNames.some((name) => Boolean(process.env[name]));

  if (!hasCtpCredentials) {
    if (hasAnyCredentials) {
      throw new Error("commercetools credentials are incomplete. Configure all CT_* variables to load Merchant Center stores.");
    }

    return demoStores;
  }

  if (!apiRoot) {
    throw new Error("commercetools is configured but its API client is unavailable.");
  }

  try {
    const response = await apiRoot.stores().get({ queryArgs: { limit: 500, sort: "createdAt asc" } }).execute();

    return response.body.results.map((store) => {
      const fields = store.custom?.fields ?? {};

      return {
        key: store.key,
        name: getLocalizedValue(store.name) || store.key,
        description: getStringField(fields, "description"),
        address: getStringField(fields, "address"),
        phone: getStringField(fields, "phone"),
        latitude: getCoordinate(fields, "latitude", -90, 90),
        longitude: getCoordinate(fields, "longitude", -180, 180),
      };
    });
  } catch (error) {
    console.error("Failed to load store locations from commercetools", error);
    throw error;
  }
}
