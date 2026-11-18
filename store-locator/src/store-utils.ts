import { STORE_LOCATOR_FIELDS } from './constants';

export type TStoreCustomField = {
  name: string;
  value: string;
};

export type TStore = {
  id: string;
  version: number;
  key: string;
  nameAllLocales: { locale: string; value: string }[];
  custom?: {
    type?: { key: string };
    customFieldsRaw?: TStoreCustomField[];
  } | null;
};

export type TStoreLocatorType = {
  key: string;
  resourceTypeIds: string[];
  fieldDefinitions: { name: string; type: { name: string } }[];
};

export function getStoreName(store: TStore, locale?: string): string {
  return (
    store.nameAllLocales.find((entry) => entry.locale === locale)?.value ??
    store.nameAllLocales[0]?.value ??
    store.key
  );
}

function decodeCustomFieldValue(value: string): unknown {
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return value;
  }
}

export function getStoreCustomField(store: TStore, name: string): string {
  const rawValue = store.custom?.customFieldsRaw?.find(
    (field) => field.name === name
  )?.value;
  if (typeof rawValue !== 'string') return '';

  const value = decodeCustomFieldValue(rawValue);
  return typeof value === 'string' || typeof value === 'number'
    ? String(value)
    : '';
}

export function getStoreLocatorTypeIssue(
  type?: TStoreLocatorType | null
): string | undefined {
  if (!type) {
    return 'The Store locator Custom Type is missing. From the storefront repository root, run `node scripts/setup-store-locator-type.mjs`, then refresh this page.';
  }
  if (!type.resourceTypeIds.includes('store')) {
    return 'The store-locator Type is not assigned to the Store resource. Review the Type definition before managing locator fields.';
  }

  const fields = new Map(
    type.fieldDefinitions.map((field) => [field.name, field.type.name])
  );
  const incompatible = Object.entries(STORE_LOCATOR_FIELDS).filter(
    ([name, expectedType]) => fields.get(name) !== expectedType
  );
  if (incompatible.length > 0) {
    return `The store-locator Type is missing or has incompatible fields: ${incompatible
      .map(([name, expectedType]) => `${name} (${expectedType})`)
      .join(', ')}. Review the Type definition before managing locator fields.`;
  }
  return undefined;
}

export function serializeStoreCustomValue(value: string | number): string {
  return JSON.stringify(value);
}
