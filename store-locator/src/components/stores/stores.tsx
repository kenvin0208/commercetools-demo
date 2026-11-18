import { useMemo } from 'react';
import { Switch, useHistory, useRouteMatch } from 'react-router-dom';
import {
  ApplicationPageTitle,
  SuspendedRoute,
} from '@commercetools-frontend/application-shell';
import { useApplicationContext } from '@commercetools-frontend/application-shell-connectors';
import { useIsAuthorized } from '@commercetools-frontend/permissions';
import DataTable, { type TColumn } from '@commercetools-uikit/data-table';
import {
  useDataTableSortingState,
  usePaginationState,
} from '@commercetools-uikit/hooks';
import { PlusBoldIcon } from '@commercetools-uikit/icons';
import FlatButton from '@commercetools-uikit/flat-button';
import LoadingSpinner from '@commercetools-uikit/loading-spinner';
import { ContentNotification } from '@commercetools-uikit/notifications';
import { Pagination } from '@commercetools-uikit/pagination';
import Spacings from '@commercetools-uikit/spacings';
import Text from '@commercetools-uikit/text';
import { PERMISSIONS } from '../../constants';
import { getErrorMessage } from '../../helpers';
import {
  useStoreLocatorTypeFetcher,
  useStoresFetcher,
} from '../../hooks/use-stores-connector';
import {
  getStoreCustomField,
  getStoreLocatorTypeIssue,
  getStoreName,
  type TStore,
} from '../../store-utils';
import StoreDetails from '../store-details';

const COLUMNS: TColumn<TStore>[] = [
  { key: 'name', label: 'Store' },
  { key: 'address', label: 'Address' },
  { key: 'phone', label: 'Phone' },
  { key: 'key', label: 'Key', isSortable: true },
];

const Stores = () => {
  const match = useRouteMatch();
  const { push } = useHistory();
  const { page, perPage } = usePaginationState();
  const tableSorting = useDataTableSortingState({
    key: 'key',
    order: 'asc',
  });
  const { dataLocale } = useApplicationContext((context) => ({
    dataLocale: context.dataLocale ?? 'en-AU',
  }));
  const canManage = useIsAuthorized({
    demandedPermissions: [PERMISSIONS.Manage],
  });
  const { stores, total, error, loading } = useStoresFetcher({
    limit: perPage.value,
    offset: (page.value - 1) * perPage.value,
    sort: [`${tableSorting.value.key} ${tableSorting.value.order}`],
  });
  const {
    type: storeLocatorType,
    error: typeError,
    loading: typeLoading,
  } = useStoreLocatorTypeFetcher();
  const typeIssue = useMemo(() => {
    if (typeLoading) return undefined;
    if (typeError) {
      return `Could not verify the store-locator Custom Type: ${getErrorMessage(
        typeError
      )}`;
    }
    return getStoreLocatorTypeIssue(storeLocatorType);
  }, [storeLocatorType, typeError, typeLoading]);
  const canManageLocations = canManage && !typeLoading && !typeIssue;

  if (error) {
    return (
      <ContentNotification type="error">
        <Text.Body>Could not load Stores: {getErrorMessage(error)}</Text.Body>
      </ContentNotification>
    );
  }

  return (
    <Spacings.Stack scale="l">
      <ApplicationPageTitle additionalParts={['Store Locator']} />

      <Spacings.Inline alignItems="center" justifyContent="space-between">
        <Spacings.Stack scale="xs">
          <Text.Headline as="h2">Store Locator</Text.Headline>
          <Text.Detail tone="secondary">
            Manage store details and the address and coordinates used by the
            storefront locator.
          </Text.Detail>
        </Spacings.Stack>

        <FlatButton
          label="Add store"
          icon={<PlusBoldIcon />}
          isDisabled={!canManageLocations}
          onClick={() => push(`${match.url}/new`)}
        />
      </Spacings.Inline>

      {typeIssue ? (
        <ContentNotification type={typeError ? 'error' : 'warning'}>
          <Text.Body>{typeIssue}</Text.Body>
        </ContentNotification>
      ) : null}

      {loading && stores.length === 0 ? (
        <Spacings.Stack alignItems="center">
          <LoadingSpinner />
        </Spacings.Stack>
      ) : null}

      {!loading && total === 0 ? (
        <ContentNotification type="info">
          <Text.Body>
            No stores yet. Create a Store after the `store-locator` Custom Type
            is ready.
          </Text.Body>
        </ContentNotification>
      ) : null}

      {total > 0 ? (
        <Spacings.Stack scale="l">
          <DataTable<TStore>
            isCondensed
            columns={COLUMNS}
            rows={stores}
            sortedBy={tableSorting.value.key}
            sortDirection={tableSorting.value.order}
            onSortChange={tableSorting.onChange}
            onRowClick={(store) =>
              push(`${match.url}/${encodeURIComponent(store.key)}`)
            }
            itemRenderer={(store, column) => {
              switch (column.key) {
                case 'name':
                  return getStoreName(store, dataLocale);
                case 'address':
                  return getStoreCustomField(store, 'address') || '—';
                case 'phone':
                  return getStoreCustomField(store, 'phone') || '—';
                case 'key':
                  return store.key;
                default:
                  return null;
              }
            }}
          />
          <Pagination
            page={page.value}
            onPageChange={page.onChange}
            perPage={perPage.value}
            onPerPageChange={perPage.onChange}
            totalItems={total}
            perPageRange="s"
          />
        </Spacings.Stack>
      ) : null}

      <Switch>
        <SuspendedRoute path={`${match.path}/new`}>
          <StoreDetails
            mode="create"
            typeIssue={typeIssue}
            canManage={canManage}
            canManageLocations={canManageLocations}
            onClose={() => push(match.url)}
          />
        </SuspendedRoute>
        <SuspendedRoute path={`${match.path}/:key`}>
          <StoreDetails
            mode="edit"
            typeIssue={typeIssue}
            canManage={canManage}
            canManageLocations={canManageLocations}
            onClose={() => push(match.url)}
          />
        </SuspendedRoute>
      </Switch>
    </Spacings.Stack>
  );
};
Stores.displayName = 'Stores';

export default Stores;
