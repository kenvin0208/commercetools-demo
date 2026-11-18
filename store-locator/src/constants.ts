// Make sure to import the helper functions from the `ssr` entry point.
import { entryPointUriPathToPermissionKeys } from '@commercetools-frontend/application-shell/ssr';

export const entryPointUriPath = 'stores';

export const PERMISSIONS = entryPointUriPathToPermissionKeys(entryPointUriPath);

export const STORE_LOCATOR_TYPE_KEY = 'store-locator';
export const STORE_LOCATOR_FIELDS = {
  description: 'String',
  address: 'String',
  phone: 'String',
  latitude: 'Number',
  longitude: 'Number',
} as const;
