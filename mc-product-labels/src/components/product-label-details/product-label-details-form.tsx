import { useMemo, useState, type JSX, type ReactElement } from 'react';
import { useFormik, type FormikErrors, type FormikHelpers } from 'formik';
import { useIntl } from 'react-intl';
import { useApplicationContext } from '@commercetools-frontend/application-shell-connectors';
import Card from '@commercetools-uikit/card';
import DateTimeField from '@commercetools-uikit/date-time-field';
import FieldErrors from '@commercetools-uikit/field-errors';
import FieldLabel from '@commercetools-uikit/field-label';
import Grid from '@commercetools-uikit/grid';
import { BinLinearIcon, PlusBoldIcon } from '@commercetools-uikit/icons';
import MultilineTextField from '@commercetools-uikit/multiline-text-field';
import NumberField from '@commercetools-uikit/number-field';
import SecondaryButton from '@commercetools-uikit/secondary-button';
import SelectField from '@commercetools-uikit/select-field';
import Spacings from '@commercetools-uikit/spacings';
import Stamp from '@commercetools-uikit/stamp';
import Tag from '@commercetools-uikit/tag';
import Text from '@commercetools-uikit/text';
import TextField from '@commercetools-uikit/text-field';
import TextInput from '@commercetools-uikit/text-input';
import ToggleInput from '@commercetools-uikit/toggle-input';
import {
  useProductTypesFetcher,
  useProductsFetcher,
  type TProductTypeAttributeDefinition,
  type TRawCatalogProduct,
} from '../../hooks/use-product-labels-connector';
import {
  CSS_STYLE_PRESETS,
  OPERATOR_OPTIONS,
  POSITION_OPTIONS,
  TARGET_MODE_OPTIONS,
  getLabelStatus,
  slugifyLabelKey,
  type TProductLabelAttributeOperator,
  type TProductLabelPosition,
  type TProductLabelTargetMode,
  type TProductLabelTargetProduct,
} from '../../label-utils';
import LiveProductCardPreview from '../product-label-preview';
import {
  formValuesToConfig,
  validateProductLabelForm,
  type TProductLabelFormValues,
} from './conversions';
import messages from './messages';

type FormProps = {
  formElements: ReactElement;
  values: TProductLabelFormValues;
  isDirty: boolean;
  isSubmitting: boolean;
  submitForm: () => Promise<unknown>;
  handleReset: () => void;
};

type TProductLabelDetailsFormProps = {
  mode: 'create' | 'edit';
  initialValues: TProductLabelFormValues;
  existingKeys?: string[];
  isReadOnly: boolean;
  onSubmit: (
    values: TProductLabelFormValues,
    formikHelpers: FormikHelpers<TProductLabelFormValues>
  ) => void | Promise<unknown>;
  onDeleteRequest?: () => void;
  children: (formProps: FormProps) => JSX.Element;
};

type TResolvedAttributeOption = {
  name: string;
  label: string;
  typeName: string;
  enumValues: { value: string; label: string }[];
};

const CUSTOM_ATTRIBUTE_VALUE = '__custom__';

function pickLocalizedLabel(
  entries: { locale: string; value: string }[] | undefined,
  preferredLocale: string
): string {
  if (!entries || entries.length === 0) return '';
  return (
    entries.find((entry) => entry.locale === preferredLocale)?.value ??
    entries[0]?.value ??
    ''
  );
}

function resolveProductDisplay(
  product: TRawCatalogProduct,
  dataLocale: string
): { id: string; key?: string; name: string; sku?: string } {
  const snapshot = product.masterData?.current ?? product.masterData?.staged;
  const localizedName = pickLocalizedLabel(
    snapshot?.nameAllLocales,
    dataLocale
  );
  return {
    id: product.id,
    key: product.key,
    name: localizedName || product.key || product.id,
    sku: snapshot?.masterVariant?.sku,
  };
}

const ProductLabelDetailsForm = (props: TProductLabelDetailsFormProps) => {
  const intl = useIntl();
  const [hasManualKey, setHasManualKey] = useState(props.mode === 'edit');
  const [manualProductInput, setManualProductInput] = useState('');
  const [selectedProductToAdd, setSelectedProductToAdd] = useState('');

  const { dataLocale, userTimeZone } = useApplicationContext((context) => ({
    dataLocale: context.dataLocale ?? 'en-US',
    userTimeZone: context.user?.timeZone || 'UTC',
  }));

  const { products, loading: loadingProducts } = useProductsFetcher(100);
  const { productTypes, loading: loadingProductTypes } =
    useProductTypesFetcher();

  const formik = useFormik<TProductLabelFormValues>({
    initialValues: props.initialValues,
    onSubmit: props.onSubmit,
    validate: (values) => {
      const errors = validateProductLabelForm(values);
      if (
        props.mode === 'create' &&
        !errors.key &&
        props.existingKeys?.includes(values.key.trim())
      ) {
        errors.key = { duplicate: true };
      }
      return errors as FormikErrors<TProductLabelFormValues>;
    },
    enableReinitialize: true,
  });

  const fieldErrors = TextField.toFieldErrors<TProductLabelFormValues>(
    formik.errors
  );
  const selectFieldErrors = SelectField.toFieldErrors<TProductLabelFormValues>(
    formik.errors
  );

  const attributeCatalog = useMemo<TResolvedAttributeOption[]>(() => {
    const byName = new Map<string, TResolvedAttributeOption>();

    const extractEnumValues = (
      def: TProductTypeAttributeDefinition
    ): { value: string; label: string }[] => {
      const targetType =
        def.type.name === 'set' ? def.type.elementType : def.type;
      if (!targetType) return [];
      if (targetType.name === 'boolean') {
        return [
          { value: 'true', label: 'true' },
          { value: 'false', label: 'false' },
        ];
      }
      const values = targetType.values?.results ?? [];
      return values.map((entry) => {
        const display =
          entry.label ||
          pickLocalizedLabel(entry.labelAllLocales, dataLocale) ||
          entry.key;
        return {
          value: entry.key,
          label: `${display} (${entry.key})`,
        };
      });
    };

    for (const productType of productTypes) {
      for (const attr of productType.attributeDefinitions?.results ?? []) {
        const existing = byName.get(attr.name);
        const localizedLabel =
          pickLocalizedLabel(attr.labelAllLocales, dataLocale) || attr.name;
        const typeName =
          attr.type.name === 'set' && attr.type.elementType
            ? `set<${attr.type.elementType.name}>`
            : attr.type.name;
        const enumValues = extractEnumValues(attr);

        if (!existing) {
          byName.set(attr.name, {
            name: attr.name,
            label: `${localizedLabel} (${attr.name}) — ${typeName}`,
            typeName,
            enumValues,
          });
        } else if (enumValues.length > existing.enumValues.length) {
          existing.enumValues = enumValues;
        }
      }
    }

    return Array.from(byName.values()).sort((a, b) =>
      a.label.localeCompare(b.label)
    );
  }, [dataLocale, productTypes]);

  const selectedAttributeMeta = useMemo(
    () =>
      attributeCatalog.find(
        (item) => item.name === formik.values.attributeName
      ),
    [attributeCatalog, formik.values.attributeName]
  );

  const isCustomAttributeMode =
    formik.values.attributeName.length > 0 && !selectedAttributeMeta;

  const productSelectOptions = useMemo(() => {
    const selectedIds = new Set(
      formik.values.selectedProducts.map((item) => item.id)
    );
    return products
      .filter((product) => !selectedIds.has(product.id))
      .map((product) => {
        const display = resolveProductDisplay(product, dataLocale);
        const suffix = [display.key, display.sku].filter(Boolean).join(' · ');
        return {
          value: display.id,
          label: suffix ? `${display.name} (${suffix})` : display.name,
        };
      });
  }, [dataLocale, formik.values.selectedProducts, products]);

  const previewStatus = useMemo(
    () => getLabelStatus(formValuesToConfig(formik.values)),
    [formik.values]
  );

  const statusTone =
    previewStatus === 'active'
      ? 'positive'
      : previewStatus === 'scheduled'
      ? 'information'
      : previewStatus === 'expired'
      ? 'warning'
      : 'secondary';

  const handleAddCatalogProduct = (productId: string) => {
    if (!productId) return;
    const match = products.find((product) => product.id === productId);
    if (!match) return;
    const display = resolveProductDisplay(match, dataLocale);
    const nextList: TProductLabelTargetProduct[] = [
      ...formik.values.selectedProducts,
      { id: display.id, key: display.key, name: display.name },
    ];
    void formik.setFieldValue('selectedProducts', nextList);
    setSelectedProductToAdd('');
  };

  const handleAddManualProduct = () => {
    const trimmed = manualProductInput.trim();
    if (!trimmed) return;
    const alreadyExists = formik.values.selectedProducts.some(
      (item) => item.id === trimmed || item.key === trimmed
    );
    if (alreadyExists) {
      setManualProductInput('');
      return;
    }

    const catalogMatch = products.find(
      (product) => product.id === trimmed || product.key === trimmed
    );
    const nextProduct: TProductLabelTargetProduct = catalogMatch
      ? (() => {
          const display = resolveProductDisplay(catalogMatch, dataLocale);
          return { id: display.id, key: display.key, name: display.name };
        })()
      : { id: trimmed, name: trimmed };

    void formik.setFieldValue('selectedProducts', [
      ...formik.values.selectedProducts,
      nextProduct,
    ]);
    setManualProductInput('');
  };

  const handleRemoveProduct = (idToRemove: string) => {
    void formik.setFieldValue(
      'selectedProducts',
      formik.values.selectedProducts.filter((item) => item.id !== idToRemove)
    );
  };

  const showProductsSection =
    formik.values.targetMode === 'products' ||
    formik.values.targetMode === 'both';
  const showAttributeSection =
    formik.values.targetMode === 'attribute' ||
    formik.values.targetMode === 'both';

  const formElements = (
    <Grid
      gridGap="24px"
      gridTemplateColumns="minmax(0, 1.6fr) minmax(260px, 0.9fr)"
    >
      <Grid.Item>
        <Spacings.Stack scale="l">
          <Card theme="light" type="raised">
            <Spacings.Stack scale="m">
              <Spacings.Inline
                alignItems="center"
                justifyContent="space-between"
              >
                <Text.Subheadline as="h4">Basic Configuration</Text.Subheadline>
                <Spacings.Inline alignItems="center" scale="s">
                  <ToggleInput
                    id="label-enabled-toggle"
                    name="enabled"
                    isChecked={formik.values.enabled}
                    isDisabled={props.isReadOnly}
                    onChange={(event) => {
                      void formik.setFieldValue(
                        'enabled',
                        event.target.checked
                      );
                    }}
                  />
                  <FieldLabel
                    htmlFor="label-enabled-toggle"
                    title={intl.formatMessage(messages.enabledLabel)}
                  />
                </Spacings.Inline>
              </Spacings.Inline>

              <TextField
                name="name"
                title={intl.formatMessage(messages.nameLabel)}
                value={formik.values.name}
                errors={fieldErrors.name}
                touched={formik.touched.name}
                isRequired
                isReadOnly={props.isReadOnly}
                placeholder="e.g. Summer Flash Sale"
                onChange={(event) => {
                  const nextName = event.target.value;
                  void formik.setFieldValue('name', nextName);
                  if (props.mode === 'create' && !hasManualKey) {
                    void formik.setFieldValue('key', slugifyLabelKey(nextName));
                  }
                }}
                onBlur={formik.handleBlur}
                horizontalConstraint={16}
              />

              <TextField
                name="key"
                title={intl.formatMessage(messages.keyLabel)}
                hint={intl.formatMessage(messages.keyHint)}
                value={formik.values.key}
                errors={fieldErrors.key}
                touched={formik.touched.key}
                isRequired
                isReadOnly={props.isReadOnly || props.mode === 'edit'}
                placeholder="e.g. summer-flash-sale"
                renderError={(errorKey) => {
                  if (errorKey === 'invalidFormat') {
                    return 'Key must be 2–256 chars using letters, numbers, hyphens, or underscores.';
                  }
                  if (errorKey === 'duplicate') {
                    return 'A label with this key already exists.';
                  }
                  return null;
                }}
                onChange={(event) => {
                  setHasManualKey(true);
                  formik.handleChange(event);
                }}
                onBlur={formik.handleBlur}
                horizontalConstraint={16}
              />

              <Grid gridGap="16px" gridTemplateColumns="2fr 1fr">
                <Grid.Item>
                  <TextField
                    name="text"
                    title={intl.formatMessage(messages.textLabel)}
                    value={formik.values.text}
                    errors={fieldErrors.text}
                    touched={formik.touched.text}
                    isRequired
                    isReadOnly={props.isReadOnly}
                    placeholder="e.g. SALE -20%"
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    horizontalConstraint="scale"
                  />
                </Grid.Item>
                <Grid.Item>
                  <NumberField
                    name="priority"
                    title={intl.formatMessage(messages.priorityLabel)}
                    value={formik.values.priority}
                    errors={fieldErrors.priority}
                    touched={formik.touched.priority}
                    isReadOnly={props.isReadOnly}
                    step={1}
                    renderError={(errorKey) => {
                      if (errorKey === 'invalidNumber') {
                        return 'Priority must be a valid number.';
                      }
                      return null;
                    }}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    horizontalConstraint="scale"
                  />
                </Grid.Item>
              </Grid>
            </Spacings.Stack>
          </Card>

          <Card theme="light" type="raised">
            <Spacings.Stack scale="m">
              <Text.Subheadline as="h4">Schedule</Text.Subheadline>
              <Text.Detail tone="secondary">
                Leave dates blank to show the label immediately without
                expiration. Timezone: {userTimeZone}
              </Text.Detail>

              <Grid gridGap="16px" gridTemplateColumns="1fr 1fr">
                <Grid.Item>
                  <DateTimeField
                    name="startDate"
                    title={intl.formatMessage(messages.startDateLabel)}
                    timeZone={userTimeZone}
                    value={formik.values.startDate}
                    isReadOnly={props.isReadOnly}
                    placeholder="Select start date & time"
                    onChange={(event) => {
                      void formik.setFieldValue(
                        'startDate',
                        event.target.value ?? ''
                      );
                    }}
                    onBlur={() => {
                      void formik.setFieldTouched('startDate', true);
                    }}
                    horizontalConstraint="scale"
                  />
                </Grid.Item>
                <Grid.Item>
                  <DateTimeField
                    name="endDate"
                    title={intl.formatMessage(messages.endDateLabel)}
                    timeZone={userTimeZone}
                    value={formik.values.endDate}
                    errors={fieldErrors.endDate}
                    touched={formik.touched.endDate}
                    isReadOnly={props.isReadOnly}
                    placeholder="Select end date & time"
                    renderError={(errorKey) => {
                      if (errorKey === 'endBeforeStart') {
                        return 'End date must be on or after the start date.';
                      }
                      return null;
                    }}
                    onChange={(event) => {
                      void formik.setFieldValue(
                        'endDate',
                        event.target.value ?? ''
                      );
                    }}
                    onBlur={() => {
                      void formik.setFieldTouched('endDate', true);
                    }}
                    horizontalConstraint="scale"
                  />
                </Grid.Item>
              </Grid>
            </Spacings.Stack>
          </Card>

          <Card theme="light" type="raised">
            <Spacings.Stack scale="m">
              <Text.Subheadline as="h4">
                Placement & Custom CSS
              </Text.Subheadline>

              <SelectField
                name="position"
                title={intl.formatMessage(messages.positionLabel)}
                value={formik.values.position}
                options={POSITION_OPTIONS}
                isReadOnly={props.isReadOnly}
                isRequired
                onChange={(event) => {
                  void formik.setFieldValue(
                    'position',
                    (event.target.value as TProductLabelPosition) || 'top-left'
                  );
                }}
                onBlur={formik.handleBlur}
                horizontalConstraint={16}
              />

              <Spacings.Stack scale="xs">
                <Text.Detail tone="secondary">Style presets:</Text.Detail>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {CSS_STYLE_PRESETS.map((preset) => (
                    <SecondaryButton
                      key={preset.name}
                      size="10"
                      label={preset.name}
                      isDisabled={props.isReadOnly}
                      onClick={() => {
                        void formik.setFieldValue('customCss', preset.css);
                      }}
                    />
                  ))}
                </div>
              </Spacings.Stack>

              <MultilineTextField
                name="customCss"
                title={intl.formatMessage(messages.customCssLabel)}
                hint={intl.formatMessage(messages.customCssHint)}
                value={formik.values.customCss}
                isReadOnly={props.isReadOnly}
                defaultExpandMultilineText
                placeholder="background: #dc2626;&#10;color: #ffffff;&#10;border-radius: 9999px;&#10;padding: 4px 10px;"
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                horizontalConstraint={16}
              />
            </Spacings.Stack>
          </Card>

          <Card theme="light" type="raised">
            <Spacings.Stack scale="m">
              <Text.Subheadline as="h4">Product Targeting</Text.Subheadline>

              <SelectField
                name="targetMode"
                title={intl.formatMessage(messages.targetModeLabel)}
                value={formik.values.targetMode}
                options={TARGET_MODE_OPTIONS}
                isReadOnly={props.isReadOnly}
                isRequired
                onChange={(event) => {
                  void formik.setFieldValue(
                    'targetMode',
                    (event.target.value as TProductLabelTargetMode) ||
                      'products'
                  );
                }}
                onBlur={formik.handleBlur}
                horizontalConstraint={16}
              />

              {showProductsSection ? (
                <Spacings.Stack scale="s">
                  <SelectField
                    name="productPicker"
                    title={intl.formatMessage(messages.productsPickerLabel)}
                    hint={
                      loadingProducts
                        ? 'Loading catalog products...'
                        : 'Select products from catalog to attach this label.'
                    }
                    value={selectedProductToAdd}
                    options={productSelectOptions}
                    isSearchable
                    isClearable
                    isDisabled={props.isReadOnly || loadingProducts}
                    onChange={(event) => {
                      const nextId =
                        typeof event.target.value === 'string'
                          ? event.target.value
                          : '';
                      setSelectedProductToAdd(nextId);
                      handleAddCatalogProduct(nextId);
                    }}
                    horizontalConstraint={16}
                  />

                  <Spacings.Inline alignItems="center" scale="s">
                    <div style={{ flex: 1 }}>
                      <TextInput
                        name="manualProductInput"
                        value={manualProductInput}
                        isReadOnly={props.isReadOnly}
                        placeholder="Or paste a commercetools product ID or key..."
                        onChange={(event) =>
                          setManualProductInput(event.target.value)
                        }
                      />
                    </div>
                    <SecondaryButton
                      size="20"
                      label="Add ID / Key"
                      iconLeft={<PlusBoldIcon />}
                      isDisabled={
                        props.isReadOnly || !manualProductInput.trim()
                      }
                      onClick={handleAddManualProduct}
                    />
                  </Spacings.Inline>

                  <FieldErrors
                    errors={selectFieldErrors.selectedProducts}
                    isVisible={Boolean(
                      formik.touched.selectedProducts || formik.submitCount > 0
                    )}
                    renderError={(errorKey) => {
                      if (errorKey === 'missingProducts') {
                        return 'Select at least one product or configure an attribute rule.';
                      }
                      return null;
                    }}
                  />

                  {formik.values.selectedProducts.length > 0 ? (
                    <div
                      style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}
                    >
                      {formik.values.selectedProducts.map((product) => (
                        <Tag
                          key={product.id}
                          tone="primary"
                          isDisabled={props.isReadOnly}
                          onRemove={
                            props.isReadOnly
                              ? undefined
                              : () => handleRemoveProduct(product.id)
                          }
                        >
                          {product.name || product.key || product.id}
                        </Tag>
                      ))}
                    </div>
                  ) : (
                    <Text.Detail tone="secondary">
                      No specific products selected yet.
                    </Text.Detail>
                  )}
                </Spacings.Stack>
              ) : null}

              {showAttributeSection ? (
                <Spacings.Stack scale="s">
                  <SelectField
                    name="attributePicker"
                    title={intl.formatMessage(messages.attributeNameLabel)}
                    hint={
                      loadingProductTypes
                        ? 'Loading attributes from Product Types...'
                        : 'Select an attribute defined on your Product Types or choose Custom attribute name.'
                    }
                    value={
                      isCustomAttributeMode
                        ? CUSTOM_ATTRIBUTE_VALUE
                        : formik.values.attributeName
                    }
                    options={[
                      ...attributeCatalog.map((item) => ({
                        value: item.name,
                        label: item.label,
                      })),
                      {
                        value: CUSTOM_ATTRIBUTE_VALUE,
                        label: 'Custom attribute name...',
                      },
                    ]}
                    isSearchable
                    isClearable
                    isDisabled={props.isReadOnly}
                    errors={selectFieldErrors.attributeName}
                    touched={formik.touched.attributeName}
                    onChange={(event) => {
                      const nextValue =
                        typeof event.target.value === 'string'
                          ? event.target.value
                          : '';
                      if (nextValue === CUSTOM_ATTRIBUTE_VALUE) {
                        void formik.setFieldValue('attributeName', 'brand');
                        void formik.setFieldValue('attributeLabel', '');
                        return;
                      }
                      const meta = attributeCatalog.find(
                        (item) => item.name === nextValue
                      );
                      void formik.setFieldValue('attributeName', nextValue);
                      void formik.setFieldValue(
                        'attributeLabel',
                        meta?.label ?? ''
                      );
                    }}
                    horizontalConstraint={16}
                  />

                  {isCustomAttributeMode ||
                  attributeCatalog.length === 0 ||
                  formik.values.attributeName === 'brand' ? (
                    <TextField
                      name="attributeName"
                      title="Attribute Technical Name"
                      value={formik.values.attributeName}
                      errors={fieldErrors.attributeName}
                      touched={formik.touched.attributeName}
                      isReadOnly={props.isReadOnly}
                      placeholder="e.g. brand, color, collection, badge"
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      horizontalConstraint={16}
                    />
                  ) : null}

                  <Grid gridGap="16px" gridTemplateColumns="1fr 1.5fr">
                    <Grid.Item>
                      <SelectField
                        name="attributeOperator"
                        title={intl.formatMessage(
                          messages.attributeOperatorLabel
                        )}
                        value={formik.values.attributeOperator}
                        options={OPERATOR_OPTIONS}
                        isReadOnly={props.isReadOnly}
                        onChange={(event) => {
                          void formik.setFieldValue(
                            'attributeOperator',
                            (event.target
                              .value as TProductLabelAttributeOperator) ||
                              'equals'
                          );
                        }}
                        horizontalConstraint="scale"
                      />
                    </Grid.Item>
                    <Grid.Item>
                      {selectedAttributeMeta &&
                      selectedAttributeMeta.enumValues.length > 0 &&
                      formik.values.attributeOperator === 'equals' ? (
                        <SelectField
                          name="attributeValue"
                          title={intl.formatMessage(
                            messages.attributeValueLabel
                          )}
                          value={formik.values.attributeValue}
                          options={selectedAttributeMeta.enumValues}
                          errors={selectFieldErrors.attributeValue}
                          touched={formik.touched.attributeValue}
                          isSearchable
                          isClearable
                          isReadOnly={props.isReadOnly}
                          isRequired
                          onChange={(event) => {
                            void formik.setFieldValue(
                              'attributeValue',
                              typeof event.target.value === 'string'
                                ? event.target.value
                                : ''
                            );
                          }}
                          horizontalConstraint="scale"
                        />
                      ) : (
                        <TextField
                          name="attributeValue"
                          title={intl.formatMessage(
                            messages.attributeValueLabel
                          )}
                          hint={
                            formik.values.attributeOperator === 'in'
                              ? 'Separate multiple values with commas (e.g. Lumina, Forma).'
                              : 'Matches enum key, enum label, localized text, boolean, or number.'
                          }
                          value={formik.values.attributeValue}
                          errors={fieldErrors.attributeValue}
                          touched={formik.touched.attributeValue}
                          isReadOnly={props.isReadOnly}
                          isRequired
                          placeholder="e.g. Lumina"
                          onChange={formik.handleChange}
                          onBlur={formik.handleBlur}
                          horizontalConstraint="scale"
                        />
                      )}
                    </Grid.Item>
                  </Grid>
                </Spacings.Stack>
              ) : null}
            </Spacings.Stack>
          </Card>

          {props.mode === 'edit' &&
          props.onDeleteRequest &&
          !props.isReadOnly ? (
            <Card theme="light" type="flat">
              <Spacings.Inline
                alignItems="center"
                justifyContent="space-between"
              >
                <Spacings.Stack scale="xs">
                  <Text.Subheadline as="h4">Danger Zone</Text.Subheadline>
                  <Text.Detail tone="secondary">
                    Deleting this label removes its Custom Object from
                    commercetools.
                  </Text.Detail>
                </Spacings.Stack>
                <SecondaryButton
                  label={intl.formatMessage(messages.deleteButton)}
                  iconLeft={<BinLinearIcon />}
                  onClick={props.onDeleteRequest}
                />
              </Spacings.Inline>
            </Card>
          ) : null}
        </Spacings.Stack>
      </Grid.Item>

      <Grid.Item>
        <Spacings.Stack scale="m">
          <LiveProductCardPreview
            text={formik.values.text}
            position={formik.values.position}
            customCss={formik.values.customCss}
          />
          <Card theme="light" type="flat">
            <Spacings.Stack scale="s">
              <Spacings.Inline
                alignItems="center"
                justifyContent="space-between"
              >
                <Text.Body isBold>Effective Status</Text.Body>
                <Stamp
                  tone={statusTone}
                  label={previewStatus.toUpperCase()}
                  isCondensed
                />
              </Spacings.Inline>
              <Text.Detail tone="secondary">
                Stored in commercetools Custom Object container{' '}
                <code>product-labels</code>.
              </Text.Detail>
            </Spacings.Stack>
          </Card>
        </Spacings.Stack>
      </Grid.Item>
    </Grid>
  );

  return props.children({
    formElements,
    values: formik.values,
    isDirty: formik.dirty,
    isSubmitting: formik.isSubmitting,
    submitForm: formik.submitForm,
    handleReset: () => formik.resetForm(),
  });
};
ProductLabelDetailsForm.displayName = 'ProductLabelDetailsForm';

export default ProductLabelDetailsForm;
