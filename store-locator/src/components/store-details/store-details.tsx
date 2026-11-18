import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useShowNotification } from '@commercetools-frontend/actions-global';
import {
  ConfirmationDialog,
  FormModalPage,
  PageNotFound,
} from '@commercetools-frontend/application-components';
import { useApplicationContext } from '@commercetools-frontend/application-shell-connectors';
import { DOMAINS } from '@commercetools-frontend/constants';
import { useIsAuthorized } from '@commercetools-frontend/permissions';
import FlatButton from '@commercetools-uikit/flat-button';
import LoadingSpinner from '@commercetools-uikit/loading-spinner';
import { ContentNotification } from '@commercetools-uikit/notifications';
import Spacings from '@commercetools-uikit/spacings';
import Text from '@commercetools-uikit/text';
import TextField from '@commercetools-uikit/text-field';
import { PERMISSIONS, STORE_LOCATOR_TYPE_KEY } from '../../constants';
import {
  useStoreDeleter,
  useStoreDetailsFetcher,
  useStoreSaver,
} from '../../hooks/use-stores-connector';
import {
  getStoreCustomField,
  getStoreName,
  type TStore,
} from '../../store-utils';

type TStoreDetailsProps = {
  mode: 'create' | 'edit';
  typeIssue?: string;
  canManage: boolean;
  canManageLocations: boolean;
  onClose: () => void;
};

type TStoreFormValues = {
  key: string;
  name: string;
  description: string;
  address: string;
  phone: string;
  latitude: string;
  longitude: string;
};

const emptyValues: TStoreFormValues = {
  key: '',
  name: '',
  description: '',
  address: '',
  phone: '',
  latitude: '',
  longitude: '',
};

function valuesForStore(store: TStore, locale: string): TStoreFormValues {
  return {
    key: store.key,
    name: getStoreName(store, locale),
    description: getStoreCustomField(store, 'description'),
    address: getStoreCustomField(store, 'address'),
    phone: getStoreCustomField(store, 'phone'),
    latitude: getStoreCustomField(store, 'latitude'),
    longitude: getStoreCustomField(store, 'longitude'),
  };
}

function toErrorMessage(error: unknown): string {
  const entries = Array.isArray(error) ? error : [error];
  return entries
    .map((entry) => {
      if (
        entry &&
        typeof entry === 'object' &&
        'message' in entry &&
        typeof entry.message === 'string'
      ) {
        return entry.message;
      }
      return entry instanceof Error ? entry.message : String(entry);
    })
    .join('\n');
}

function validate(values: TStoreFormValues, mode: 'create' | 'edit') {
  if (!values.name.trim()) return 'Store name is required.';
  if (mode === 'create' && !/^[a-zA-Z0-9_-]{2,256}$/.test(values.key.trim())) {
    return 'Store key must be 2–256 characters and contain only letters, numbers, underscores, or hyphens.';
  }

  const latitude = values.latitude.trim();
  const longitude = values.longitude.trim();
  if (Boolean(latitude) !== Boolean(longitude)) {
    return 'Enter both latitude and longitude, or leave both empty.';
  }
  if (latitude || longitude) {
    const lat = Number(latitude);
    const lng = Number(longitude);
    if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
      return 'Latitude must be a number between -90 and 90.';
    }
    if (!Number.isFinite(lng) || lng < -180 || lng > 180) {
      return 'Longitude must be a number between -180 and 180.';
    }
  }
  return undefined;
}

const StoreDetails = ({
  mode,
  typeIssue,
  canManage,
  canManageLocations,
  onClose,
}: TStoreDetailsProps) => {
  const { key } = useParams<{ key?: string }>();
  const { dataLocale, projectLanguages } = useApplicationContext((context) => ({
    dataLocale: context.dataLocale ?? 'en-AU',
    projectLanguages: context.project?.languages,
  }));
  const locale =
    projectLanguages?.includes('en-AU') === true
      ? 'en-AU'
      : projectLanguages?.[0] ?? dataLocale;
  const storeKey = key ? decodeURIComponent(key) : undefined;
  const {
    store,
    error: storeError,
    loading: storeLoading,
  } = useStoreDetailsFetcher(mode === 'edit' ? storeKey : undefined);
  const [values, setValues] = useState<TStoreFormValues>(
    store ? valuesForStore(store, locale) : emptyValues
  );
  const [errorMessage, setErrorMessage] = useState<string>();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const saveStore = useStoreSaver();
  const deleteStore = useStoreDeleter();
  const showNotification = useShowNotification();
  const canManageFromPermission = useIsAuthorized({
    demandedPermissions: [PERMISSIONS.Manage],
  });
  const initialValues = useMemo(
    () => (store ? valuesForStore(store, locale) : emptyValues),
    [locale, store]
  );
  const isDirty = JSON.stringify(values) !== JSON.stringify(initialValues);
  const storeHasConflictingType = Boolean(
    store?.custom?.type?.key && store.custom.type.key !== STORE_LOCATOR_TYPE_KEY
  );

  useEffect(() => {
    setValues(initialValues);
    setErrorMessage(undefined);
  }, [initialValues]);

  const handleSave = async () => {
    const validationError = validate(values, mode);
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }
    if (typeIssue) {
      setErrorMessage(typeIssue);
      return;
    }
    if (!canManage || !canManageLocations || !canManageFromPermission) {
      setErrorMessage('You do not have permission to manage Stores.');
      return;
    }
    if (mode === 'edit' && !store) return;

    try {
      await saveStore.execute({
        store: store ?? undefined,
        values,
        locale,
      });
      showNotification({
        kind: 'success',
        domain: DOMAINS.SIDE,
        text: mode === 'create' ? 'Store created.' : 'Store updated.',
      });
      onClose();
    } catch (error) {
      setErrorMessage(toErrorMessage(error));
    }
  };

  const handleDelete = async () => {
    if (!store) return;
    try {
      await deleteStore.execute(store);
      setIsDeleteDialogOpen(false);
      showNotification({
        kind: 'success',
        domain: DOMAINS.SIDE,
        text: `Store "${store.key}" deleted.`,
      });
      onClose();
    } catch (error) {
      setIsDeleteDialogOpen(false);
      setErrorMessage(toErrorMessage(error));
    }
  };

  const isMissingStore =
    mode === 'edit' && !store && !storeLoading && !storeError;
  const title =
    mode === 'create'
      ? 'Add store'
      : store
      ? getStoreName(store, locale)
      : 'Edit store';

  return (
    <>
      <FormModalPage
        title={title}
        isOpen
        onClose={onClose}
        hideControls={isMissingStore || Boolean(storeError)}
        isPrimaryButtonDisabled={
          saveStore.loading ||
          !canManageLocations ||
          !canManageFromPermission ||
          Boolean(typeIssue) ||
          storeHasConflictingType ||
          (mode === 'edit' && !isDirty)
        }
        isSecondaryButtonDisabled={mode === 'edit' && !isDirty && !errorMessage}
        onSecondaryButtonClick={() => {
          if (mode === 'create') {
            onClose();
            return;
          }
          setValues(initialValues);
          setErrorMessage(undefined);
        }}
        onPrimaryButtonClick={() => {
          void handleSave();
        }}
        labelPrimaryButton={mode === 'create' ? 'Create store' : 'Save'}
        labelSecondaryButton={
          mode === 'create'
            ? FormModalPage.Intl.cancel
            : FormModalPage.Intl.revert
        }
      >
        {mode === 'edit' && storeLoading && !store ? (
          <Spacings.Stack alignItems="center">
            <LoadingSpinner />
          </Spacings.Stack>
        ) : null}

        {storeError ? (
          <ContentNotification type="error">
            <Text.Body>Could not load Store: {storeError.message}</Text.Body>
          </ContentNotification>
        ) : null}

        {isMissingStore ? <PageNotFound /> : null}

        {typeIssue ? (
          <ContentNotification type="warning">
            <Text.Body>{typeIssue}</Text.Body>
          </ContentNotification>
        ) : null}

        {storeHasConflictingType ? (
          <ContentNotification type="warning">
            <Text.Body>
              This Store uses the `{store?.custom?.type?.key}` Custom Type. Add
              the locator fields to that Type before editing the Store; this app
              will not replace its existing Type.
            </Text.Body>
          </ContentNotification>
        ) : null}

        {errorMessage ? (
          <ContentNotification type="error">
            <Text.Body>{errorMessage}</Text.Body>
          </ContentNotification>
        ) : null}

        {!isMissingStore && (mode === 'create' || store) ? (
          <Spacings.Stack scale="m">
            <TextField
              name="key"
              title="Store key"
              value={values.key}
              isRequired
              isReadOnly={mode === 'edit' || !canManageLocations}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  key: event.target.value,
                }))
              }
            />
            <TextField
              name="name"
              title="Store name"
              value={values.name}
              isRequired
              isReadOnly={!canManageLocations}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  name: event.target.value,
                }))
              }
            />
            <TextField
              name="description"
              title="Description"
              value={values.description}
              isReadOnly={
                !canManageLocations ||
                Boolean(typeIssue) ||
                storeHasConflictingType
              }
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
            />
            <TextField
              name="address"
              title="Address"
              value={values.address}
              isReadOnly={
                !canManageLocations ||
                Boolean(typeIssue) ||
                storeHasConflictingType
              }
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  address: event.target.value,
                }))
              }
            />
            <TextField
              name="phone"
              title="Phone"
              value={values.phone}
              isReadOnly={
                !canManageLocations ||
                Boolean(typeIssue) ||
                storeHasConflictingType
              }
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  phone: event.target.value,
                }))
              }
            />
            <Spacings.Inline scale="m">
              <TextField
                name="latitude"
                title="Latitude"
                value={values.latitude}
                hint="Decimal degrees, from -90 to 90."
                isReadOnly={
                  !canManageLocations ||
                  Boolean(typeIssue) ||
                  storeHasConflictingType
                }
                onChange={(event) =>
                  setValues((current) => ({
                    ...current,
                    latitude: event.target.value,
                  }))
                }
              />
              <TextField
                name="longitude"
                title="Longitude"
                value={values.longitude}
                hint="Decimal degrees, from -180 to 180."
                isReadOnly={
                  !canManageLocations ||
                  Boolean(typeIssue) ||
                  storeHasConflictingType
                }
                onChange={(event) =>
                  setValues((current) => ({
                    ...current,
                    longitude: event.target.value,
                  }))
                }
              />
            </Spacings.Inline>

            {mode === 'edit' && store && canManage ? (
              <FlatButton
                label="Delete store"
                isDisabled={deleteStore.loading}
                onClick={() => setIsDeleteDialogOpen(true)}
              />
            ) : null}
          </Spacings.Stack>
        ) : null}
      </FormModalPage>

      {mode === 'edit' && store ? (
        <ConfirmationDialog
          isOpen={isDeleteDialogOpen}
          title="Delete Store?"
          onCancel={() => setIsDeleteDialogOpen(false)}
          onClose={() => setIsDeleteDialogOpen(false)}
          onConfirm={() => {
            void handleDelete();
          }}
          labelPrimary={ConfirmationDialog.Intl.delete}
          labelSecondary={ConfirmationDialog.Intl.cancel}
          isPrimaryButtonDisabled={deleteStore.loading}
        >
          <Text.Body>
            Delete "{getStoreName(store, locale)}" ({store.key})? This cannot be
            undone.
          </Text.Body>
        </ConfirmationDialog>
      ) : null}
    </>
  );
};
StoreDetails.displayName = 'StoreDetails';

export default StoreDetails;
