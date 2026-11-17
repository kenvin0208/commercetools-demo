import { defineMessages } from 'react-intl';

export default defineMessages({
  title: {
    id: 'ProductLabels.title',
    defaultMessage: 'Product Labels',
  },
  subtitle: {
    id: 'ProductLabels.subtitle',
    defaultMessage:
      'Manage promotional and informational badges displayed on storefront product cards.',
  },
  createButton: {
    id: 'ProductLabels.createButton',
    defaultMessage: 'Create label',
  },
  searchPlaceholder: {
    id: 'ProductLabels.searchPlaceholder',
    defaultMessage: 'Filter labels by name, key, or text...',
  },
  emptyTitle: {
    id: 'ProductLabels.emptyTitle',
    defaultMessage: 'No product labels configured yet.',
  },
  emptyHint: {
    id: 'ProductLabels.emptyHint',
    defaultMessage:
      'Create your first product label to attach custom badges onto product card images by product or attribute.',
  },
  fetchError: {
    id: 'ProductLabels.fetchError',
    defaultMessage: 'Unable to load product labels from Custom Objects.',
  },
});
