import { PERMISSIONS, entryPointUriPath } from './src/constants';

/**
 * @type {import('@commercetools-frontend/application-config').ConfigOptionsForCustomApplication}
 */
const config = {
  name: 'Store Locator',
  entryPointUriPath,
  cloudIdentifier: 'gcp-au',
  env: {
    development: {
      initialProjectKey: 'namnx-051026',
    },
    production: {
      applicationId: 'cmwlylzdv000h01v5iv0m6cj1',
      url: 'https://store-locator-navy.vercel.app',
    },
  },
  oAuthScopes: {
    view: ['view_stores', 'view_types'],
    manage: ['manage_stores'],
  },
  icon: '${path:@commercetools-frontend/assets/application-icons/rocket.svg}',
  mainMenuLink: {
    defaultLabel: 'Store Locator',
    labelAllLocales: [],
    permissions: [PERMISSIONS.View],
  },
};

export default config;
