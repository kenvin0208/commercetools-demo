import {
  parseBoundaryDate,
  type TProductLabelAttributeOperator,
  type TProductLabelConfig,
  type TProductLabelPosition,
  type TProductLabelTargetMode,
  type TProductLabelTargetProduct,
} from '../../label-utils';

export type TProductLabelFormValues = {
  key: string;
  name: string;
  text: string;
  enabled: boolean;
  startDate: string;
  endDate: string;
  position: TProductLabelPosition;
  customCss: string;
  priority: string;
  targetMode: TProductLabelTargetMode;
  selectedProducts: TProductLabelTargetProduct[];
  attributeName: string;
  attributeOperator: TProductLabelAttributeOperator;
  attributeValue: string;
  attributeLabel: string;
};

export function createInitialFormValues(
  config?: TProductLabelConfig | null
): TProductLabelFormValues {
  if (!config) {
    return {
      key: '',
      name: '',
      text: '',
      enabled: true,
      startDate: '',
      endDate: '',
      position: 'top-left',
      customCss:
        'background: #dc2626;\ncolor: #ffffff;\nborder-radius: 9999px;\npadding: 4px 10px;\nfont-size: 11px;\nfont-weight: 700;',
      priority: '0',
      targetMode: 'products',
      selectedProducts: [],
      attributeName: '',
      attributeOperator: 'equals',
      attributeValue: '',
      attributeLabel: '',
    };
  }

  const selectedProducts: TProductLabelTargetProduct[] =
    config.products && config.products.length > 0
      ? config.products
      : config.productIds.map((id, index) => ({
          id,
          key: config.productKeys?.[index],
        }));

  return {
    key: config.id,
    name: config.name,
    text: config.text,
    enabled: config.enabled,
    startDate: config.startDate ?? '',
    endDate: config.endDate ?? '',
    position: config.position,
    customCss: config.customCss ?? '',
    priority: String(config.priority ?? 0),
    targetMode: config.targetMode,
    selectedProducts,
    attributeName: config.attributeRule?.attributeName ?? '',
    attributeOperator: config.attributeRule?.operator ?? 'equals',
    attributeValue: config.attributeRule?.value ?? '',
    attributeLabel: config.attributeRule?.attributeLabel ?? '',
  };
}

export function formValuesToConfig(
  values: TProductLabelFormValues,
  existingCreatedAt?: string
): TProductLabelConfig {
  const parsedPriority = Number(values.priority);
  const priority = Number.isFinite(parsedPriority) ? parsedPriority : 0;
  const includeProducts =
    values.targetMode === 'products' || values.targetMode === 'both';
  const includeAttribute =
    values.targetMode === 'attribute' || values.targetMode === 'both';

  const cleanProducts = includeProducts ? values.selectedProducts : [];
  const productIds = cleanProducts.map((product) => product.id);
  const productKeys = cleanProducts
    .map((product) => product.key)
    .filter((key): key is string => Boolean(key));

  const hasAttributeRule =
    includeAttribute &&
    values.attributeName.trim().length > 0 &&
    values.attributeValue.trim().length > 0;

  return {
    id: values.key.trim(),
    name: values.name.trim() || values.text.trim(),
    text: values.text.trim(),
    enabled: values.enabled,
    ...(values.startDate.trim() ? { startDate: values.startDate.trim() } : {}),
    ...(values.endDate.trim() ? { endDate: values.endDate.trim() } : {}),
    position: values.position,
    ...(values.customCss.trim() ? { customCss: values.customCss.trim() } : {}),
    priority,
    targetMode: values.targetMode,
    productIds,
    ...(productKeys.length > 0 ? { productKeys } : {}),
    ...(cleanProducts.length > 0 ? { products: cleanProducts } : {}),
    ...(hasAttributeRule
      ? {
          attributeRule: {
            attributeName: values.attributeName.trim(),
            operator: values.attributeOperator,
            value: values.attributeValue.trim(),
            ...(values.attributeLabel.trim()
              ? { attributeLabel: values.attributeLabel.trim() }
              : {}),
          },
        }
      : {}),
    createdAt: existingCreatedAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export type TProductLabelFormErrors = {
  key?: { missing?: boolean; invalidFormat?: boolean; duplicate?: boolean };
  name?: { missing?: boolean };
  text?: { missing?: boolean };
  endDate?: { endBeforeStart?: boolean };
  priority?: { invalidNumber?: boolean };
  selectedProducts?: { missingProducts?: boolean };
  attributeName?: { missing?: boolean };
  attributeValue?: { missing?: boolean };
};

const VALID_KEY_REGEX = /^[A-Za-z0-9_-]{2,256}$/;

export function validateProductLabelForm(
  values: TProductLabelFormValues
): TProductLabelFormErrors {
  const errors: TProductLabelFormErrors = {};

  const trimmedKey = values.key.trim();
  if (!trimmedKey) {
    errors.key = { missing: true };
  } else if (!VALID_KEY_REGEX.test(trimmedKey)) {
    errors.key = { invalidFormat: true };
  }

  if (!values.name.trim()) {
    errors.name = { missing: true };
  }

  if (!values.text.trim()) {
    errors.text = { missing: true };
  }

  if (values.priority.trim() && Number.isNaN(Number(values.priority))) {
    errors.priority = { invalidNumber: true };
  }

  const startMs = parseBoundaryDate(values.startDate, 'start');
  const endMs = parseBoundaryDate(values.endDate, 'end');
  if (startMs !== null && endMs !== null && endMs < startMs) {
    errors.endDate = { endBeforeStart: true };
  }

  if (
    values.targetMode === 'products' &&
    values.selectedProducts.length === 0
  ) {
    errors.selectedProducts = { missingProducts: true };
  }

  if (values.targetMode === 'attribute') {
    if (!values.attributeName.trim()) {
      errors.attributeName = { missing: true };
    }
    if (!values.attributeValue.trim()) {
      errors.attributeValue = { missing: true };
    }
  }

  if (values.targetMode === 'both') {
    const hasProducts = values.selectedProducts.length > 0;
    const hasAttrName = values.attributeName.trim().length > 0;
    const hasAttrValue = values.attributeValue.trim().length > 0;
    if (hasAttrName && !hasAttrValue) {
      errors.attributeValue = { missing: true };
    }
    if (!hasAttrName && hasAttrValue) {
      errors.attributeName = { missing: true };
    }
    if (!hasProducts && !hasAttrName && !hasAttrValue) {
      errors.selectedProducts = { missingProducts: true };
    }
  }

  return errors;
}
