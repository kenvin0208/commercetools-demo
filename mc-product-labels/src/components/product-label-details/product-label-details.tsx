import { useCallback, useEffect, useMemo, useState } from 'react';
import type { FormikHelpers } from 'formik';
import { useIntl } from 'react-intl';
import { useParams } from 'react-router-dom';
import {
  useShowApiErrorNotification,
  useShowNotification,
  type TApiErrorNotificationOptions,
} from '@commercetools-frontend/actions-global';
import {
  ConfirmationDialog,
  FormModalPage,
  PageNotFound,
} from '@commercetools-frontend/application-components';
import { ApplicationPageTitle } from '@commercetools-frontend/application-shell';
import { DOMAINS } from '@commercetools-frontend/constants';
import { useIsAuthorized } from '@commercetools-frontend/permissions';
import LoadingSpinner from '@commercetools-uikit/loading-spinner';
import { ContentNotification } from '@commercetools-uikit/notifications';
import Spacings from '@commercetools-uikit/spacings';
import Text from '@commercetools-uikit/text';
import { PERMISSIONS } from '../../constants';
import type { TProductLabelRecord } from '../../label-utils';
import {
  useProductLabelDeleter,
  useProductLabelDetailsFetcher,
  useProductLabelSaver,
} from '../../hooks/use-product-labels-connector';
import {
  createInitialFormValues,
  formValuesToConfig,
  type TProductLabelFormValues,
} from './conversions';
import messages from './messages';
import ProductLabelDetailsForm from './product-label-details-form';

type TProductLabelDetailsProps = {
  mode: 'create' | 'edit';
  existingKeys?: string[];
  onClose: () => void;
};

type TGraphQlErrorLike = {
  message?: string;
  code?: string;
  extensions?: {
    code?: string;
    field?: string;
  };
};

type TApiErrorEntry = {
  message: string;
  code?: string;
  extensions?: {
    code?: string;
  };
};

function toApiErrorList(
  error: unknown
): TApiErrorNotificationOptions['errors'] {
  const list = Array.isArray(error) ? error : [error];
  return list.map((item): TApiErrorEntry => {
    if (item && typeof item === 'object' && 'message' in item) {
      return item as TApiErrorEntry;
    }
    return {
      message:
        item instanceof Error
          ? item.message
          : 'An unexpected error occurred while saving the product label.',
    };
  });
}

function hasDuplicateKeyError(error: unknown): boolean {
  const list = Array.isArray(error) ? error : [error];
  return list.some((entry) => {
    const record = entry as TGraphQlErrorLike | undefined;
    const code = record?.extensions?.code ?? record?.code;
    const field = record?.extensions?.field;
    return code === 'DuplicateField' && (!field || field === 'key');
  });
}

const ProductLabelDetails = ({
  mode,
  existingKeys,
  onClose,
}: TProductLabelDetailsProps) => {
  const intl = useIntl();
  const params = useParams<{ key?: string }>();
  const decodedKey =
    mode === 'edit' && params.key ? decodeURIComponent(params.key) : undefined;
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [savedRecord, setSavedRecord] = useState<TProductLabelRecord | null>(
    null
  );

  useEffect(() => {
    setSavedRecord(null);
  }, [decodedKey, mode]);

  const { loading, error, labelRecord } =
    useProductLabelDetailsFetcher(decodedKey);
  const activeRecord = mode === 'edit' ? savedRecord ?? labelRecord : undefined;
  const labelSaver = useProductLabelSaver();
  const labelDeleter = useProductLabelDeleter();

  const canManage = useIsAuthorized({
    demandedPermissions: [PERMISSIONS.Manage],
  });
  const showNotification = useShowNotification();
  const showApiErrorNotification = useShowApiErrorNotification();

  const initialValues = useMemo(
    () =>
      createInitialFormValues(
        mode === 'edit' ? activeRecord?.config ?? null : null
      ),
    [mode, activeRecord?.config]
  );

  const handleSubmit = useCallback(
    async (
      formikValues: TProductLabelFormValues,
      formikHelpers: FormikHelpers<TProductLabelFormValues>
    ) => {
      const targetKey =
        mode === 'edit' && activeRecord
          ? activeRecord.key
          : formikValues.key.trim();

      if (mode === 'create' && existingKeys?.includes(targetKey)) {
        formikHelpers.setErrors({
          key: { duplicate: true },
        } as unknown as Record<string, string>);
        return;
      }

      const config = formValuesToConfig(
        {
          ...formikValues,
          key: targetKey,
        },
        mode === 'edit' ? activeRecord?.config.createdAt : undefined
      );

      try {
        const saved = await labelSaver.execute({
          key: targetKey,
          config,
          version: mode === 'edit' ? activeRecord?.version : undefined,
        });

        if (mode === 'edit' && saved) {
          setSavedRecord(saved);
        }

        showNotification({
          kind: 'success',
          domain: DOMAINS.SIDE,
          text: intl.formatMessage(
            mode === 'create' ? messages.labelCreated : messages.labelUpdated,
            { name: config.name }
          ),
        });

        if (mode === 'create') {
          onClose();
        }
      } catch (saveError) {
        if (hasDuplicateKeyError(saveError)) {
          formikHelpers.setErrors({
            key: { duplicate: true },
          } as unknown as Record<string, string>);
          return;
        }

        showApiErrorNotification({
          errors: toApiErrorList(saveError),
        });
      }
    },
    [
      activeRecord,
      existingKeys,
      intl,
      labelSaver,
      mode,
      onClose,
      showApiErrorNotification,
      showNotification,
    ]
  );

  const handleConfirmDelete = useCallback(async () => {
    if (!activeRecord) return;
    try {
      await labelDeleter.execute({
        key: activeRecord.key,
        version: activeRecord.version,
      });
      setIsDeleteDialogOpen(false);
      showNotification({
        kind: 'success',
        domain: DOMAINS.SIDE,
        text: intl.formatMessage(messages.labelDeleted, {
          name: activeRecord.config.name,
        }),
      });
      onClose();
    } catch (deleteError) {
      setIsDeleteDialogOpen(false);
      showApiErrorNotification({
        errors: toApiErrorList(deleteError),
      });
    }
  }, [
    activeRecord,
    intl,
    labelDeleter,
    onClose,
    showApiErrorNotification,
    showNotification,
  ]);

  const canRenderForm = mode === 'create' || Boolean(activeRecord);

  return (
    <>
      <ProductLabelDetailsForm
        mode={mode}
        initialValues={initialValues}
        existingKeys={existingKeys}
        isReadOnly={!canManage}
        onSubmit={handleSubmit}
        onDeleteRequest={
          mode === 'edit' ? () => setIsDeleteDialogOpen(true) : undefined
        }
      >
        {(formProps) => {
          const modalTitle =
            mode === 'create'
              ? formProps.values.name.trim() ||
                intl.formatMessage(messages.createTitle)
              : formProps.values.name.trim() ||
                activeRecord?.key ||
                intl.formatMessage(messages.editTitle);

          return (
            <FormModalPage
              title={modalTitle}
              isOpen
              onClose={onClose}
              hideControls={mode === 'edit' && activeRecord === null}
              isPrimaryButtonDisabled={
                formProps.isSubmitting ||
                !canManage ||
                (mode === 'edit' && (!formProps.isDirty || !activeRecord))
              }
              isSecondaryButtonDisabled={
                mode === 'edit' ? !formProps.isDirty : false
              }
              onSecondaryButtonClick={
                mode === 'edit' ? formProps.handleReset : onClose
              }
              onPrimaryButtonClick={() => {
                void formProps.submitForm();
              }}
              labelPrimaryButton={
                mode === 'create'
                  ? intl.formatMessage(messages.createButton)
                  : intl.formatMessage(messages.saveButton)
              }
              labelSecondaryButton={
                mode === 'create'
                  ? FormModalPage.Intl.cancel
                  : FormModalPage.Intl.revert
              }
            >
              {mode === 'edit' && loading && activeRecord === undefined ? (
                <Spacings.Stack alignItems="center">
                  <LoadingSpinner />
                </Spacings.Stack>
              ) : null}

              {mode === 'edit' && error ? (
                <ContentNotification type="error">
                  <Text.Body>
                    {intl.formatMessage(messages.fetchError)}
                  </Text.Body>
                </ContentNotification>
              ) : null}

              {canRenderForm ? formProps.formElements : null}

              {mode === 'edit' && activeRecord ? (
                <ApplicationPageTitle additionalParts={[modalTitle]} />
              ) : null}

              {mode === 'edit' &&
              !loading &&
              !error &&
              activeRecord === null ? (
                <PageNotFound />
              ) : null}
            </FormModalPage>
          );
        }}
      </ProductLabelDetailsForm>

      {mode === 'edit' && activeRecord ? (
        <ConfirmationDialog
          isOpen={isDeleteDialogOpen}
          title={intl.formatMessage(messages.deleteConfirmTitle)}
          onCancel={() => setIsDeleteDialogOpen(false)}
          onClose={() => setIsDeleteDialogOpen(false)}
          onConfirm={() => {
            void handleConfirmDelete();
          }}
          labelPrimary={ConfirmationDialog.Intl.delete}
          labelSecondary={ConfirmationDialog.Intl.cancel}
          isPrimaryButtonDisabled={labelDeleter.loading}
        >
          <Text.Body>
            {intl.formatMessage(messages.deleteConfirmMessage, {
              name: activeRecord.config.name,
            })}
          </Text.Body>
        </ConfirmationDialog>
      ) : null}
    </>
  );
};
ProductLabelDetails.displayName = 'ProductLabelDetails';

export default ProductLabelDetails;
