import { defineMessages } from 'react-intl';

export default defineMessages({
  createTitle: {
    id: 'ProductLabelDetails.createTitle',
    defaultMessage: 'Create Product Label',
  },
  editTitle: {
    id: 'ProductLabelDetails.editTitle',
    defaultMessage: 'Edit Product Label',
  },
  labelCreated: {
    id: 'ProductLabelDetails.labelCreated',
    defaultMessage: 'Product label "{name}" created.',
  },
  labelUpdated: {
    id: 'ProductLabelDetails.labelUpdated',
    defaultMessage: 'Product label "{name}" updated.',
  },
  labelDeleted: {
    id: 'ProductLabelDetails.labelDeleted',
    defaultMessage: 'Product label "{name}" deleted.',
  },
  fetchError: {
    id: 'ProductLabelDetails.fetchError',
    defaultMessage:
      'Unable to load product label details. Please verify your permissions and try again.',
  },
  saveButton: {
    id: 'ProductLabelDetails.saveButton',
    defaultMessage: 'Save label',
  },
  createButton: {
    id: 'ProductLabelDetails.createButton',
    defaultMessage: 'Create label',
  },
  deleteButton: {
    id: 'ProductLabelDetails.deleteButton',
    defaultMessage: 'Delete label',
  },
  deleteConfirmTitle: {
    id: 'ProductLabelDetails.deleteConfirmTitle',
    defaultMessage: 'Delete product label',
  },
  deleteConfirmMessage: {
    id: 'ProductLabelDetails.deleteConfirmMessage',
    defaultMessage:
      'Are you sure you want to delete "{name}"? It will immediately be removed from all matching product cards.',
  },
  keyLabel: {
    id: 'ProductLabelDetails.keyLabel',
    defaultMessage: 'Label Key (unique ID)',
  },
  keyHint: {
    id: 'ProductLabelDetails.keyHint',
    defaultMessage:
      'Used as the Custom Object key in commercetools (letters, numbers, hyphens, underscores).',
  },
  nameLabel: {
    id: 'ProductLabelDetails.nameLabel',
    defaultMessage: 'Internal Name',
  },
  textLabel: {
    id: 'ProductLabelDetails.textLabel',
    defaultMessage: 'Label Text (displayed on image)',
  },
  enabledLabel: {
    id: 'ProductLabelDetails.enabledLabel',
    defaultMessage: 'Active / Enabled',
  },
  priorityLabel: {
    id: 'ProductLabelDetails.priorityLabel',
    defaultMessage: 'Priority (higher renders first)',
  },
  startDateLabel: {
    id: 'ProductLabelDetails.startDateLabel',
    defaultMessage: 'Start Date & Time',
  },
  endDateLabel: {
    id: 'ProductLabelDetails.endDateLabel',
    defaultMessage: 'End Date & Time',
  },
  positionLabel: {
    id: 'ProductLabelDetails.positionLabel',
    defaultMessage: 'Position on Product Image',
  },
  customCssLabel: {
    id: 'ProductLabelDetails.customCssLabel',
    defaultMessage: 'Custom CSS Declarations',
  },
  customCssHint: {
    id: 'ProductLabelDetails.customCssHint',
    defaultMessage:
      'Enter standard CSS declarations (e.g. background: #dc2626; color: #fff; border-radius: 9999px; padding: 4px 10px;).',
  },
  targetModeLabel: {
    id: 'ProductLabelDetails.targetModeLabel',
    defaultMessage: 'Target Rule',
  },
  productsPickerLabel: {
    id: 'ProductLabelDetails.productsPickerLabel',
    defaultMessage: 'Assign Specific Products',
  },
  attributeNameLabel: {
    id: 'ProductLabelDetails.attributeNameLabel',
    defaultMessage: 'Product Attribute',
  },
  attributeOperatorLabel: {
    id: 'ProductLabelDetails.attributeOperatorLabel',
    defaultMessage: 'Match Operator',
  },
  attributeValueLabel: {
    id: 'ProductLabelDetails.attributeValueLabel',
    defaultMessage: 'Attribute Value',
  },
});
