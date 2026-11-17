import { PERMISSIONS, entryPointUriPath } from './src/constants';

/**
 * @type {import('@commercetools-frontend/application-config').ConfigOptionsForCustomApplication}
 */
const config = {
  name: 'Product Labels',
  description:
    'Manage promotional and attribute-based product labels displayed on storefront product cards.',
  entryPointUriPath,
  cloudIdentifier: 'gcp-au',
  env: {
    development: {
      initialProjectKey: 'namnx-051026',
    },
    production: {
      applicationId: 'cmwfrqkov000101wj4l9vb54s',
      url: 'https://commercetools-demo-mc-product-label.vercel.app',
    },
  },
  oAuthScopes: {
    view: ['view_key_value_documents', 'view_products'],
    manage: ['manage_key_value_documents'],
  },
  icon: '${path:@commercetools-frontend/assets/application-icons/pricetag.svg}',
  mainMenuLink: {
    defaultLabel: 'Product Labels',
    labelAllLocales: [{ locale: 'en', value: 'Product Labels' }],
    permissions: [PERMISSIONS.View],
  },
  submenuLinks: [
    {
      uriPath: 'labels',
      defaultLabel: 'All Labels',
      labelAllLocales: [{ locale: 'en', value: 'All Labels' }],
      permissions: [PERMISSIONS.View],
    },
    {
      uriPath: 'labels/new',
      defaultLabel: 'Create Label',
      labelAllLocales: [{ locale: 'en', value: 'Create Label' }],
      permissions: [PERMISSIONS.Manage],
    },
  ],
};

export default config;
