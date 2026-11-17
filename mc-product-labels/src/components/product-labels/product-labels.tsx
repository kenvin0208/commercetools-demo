import { useMemo, useState } from 'react';
import { useIntl } from 'react-intl';
import { Switch, useHistory, useRouteMatch } from 'react-router-dom';
import {
  ApplicationPageTitle,
  SuspendedRoute,
} from '@commercetools-frontend/application-shell';
import { useIsAuthorized } from '@commercetools-frontend/permissions';
import Card from '@commercetools-uikit/card';
import DataTable, { type TColumn } from '@commercetools-uikit/data-table';
import {
  useDataTableSortingState,
  usePaginationState,
} from '@commercetools-uikit/hooks';
import { PlusBoldIcon } from '@commercetools-uikit/icons';
import LoadingSpinner from '@commercetools-uikit/loading-spinner';
import { ContentNotification } from '@commercetools-uikit/notifications';
import { Pagination } from '@commercetools-uikit/pagination';
import PrimaryButton from '@commercetools-uikit/primary-button';
import SelectInput from '@commercetools-uikit/select-input';
import Spacings from '@commercetools-uikit/spacings';
import Stamp, { type TTone } from '@commercetools-uikit/stamp';
import Text from '@commercetools-uikit/text';
import TextInput from '@commercetools-uikit/text-input';
import { PERMISSIONS } from '../../constants';
import { getErrorMessage } from '../../helpers';
import { useProductLabelsFetcher } from '../../hooks/use-product-labels-connector';
import {
  formatPositionLabel,
  getLabelStatus,
  parseBoundaryDate,
  parseCustomCss,
  type TProductLabelConfig,
  type TProductLabelRecord,
  type TProductLabelStatus,
} from '../../label-utils';
import ProductLabelDetails from '../product-label-details';
import messages from './messages';

type TStatusFilter = 'all' | TProductLabelStatus;

const STATUS_FILTER_OPTIONS: { value: TStatusFilter; label: string }[] = [
  { value: 'all', label: 'All statuses' },
  { value: 'active', label: 'Active' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'expired', label: 'Expired' },
  { value: 'disabled', label: 'Disabled' },
];

const COLUMNS: TColumn<TProductLabelRecord>[] = [
  { key: 'name', label: 'Label' },
  { key: 'preview', label: 'Badge Preview' },
  { key: 'status', label: 'Status' },
  { key: 'position', label: 'Position' },
  { key: 'schedule', label: 'Schedule' },
  { key: 'target', label: 'Targeting' },
  { key: 'priority', label: 'Priority' },
  { key: 'key', label: 'Key', isSortable: true },
];

function getStatusTone(status: TProductLabelStatus): TTone {
  switch (status) {
    case 'active':
      return 'positive';
    case 'scheduled':
      return 'information';
    case 'expired':
      return 'warning';
    case 'disabled':
    default:
      return 'secondary';
  }
}

function formatScheduleText(
  config: TProductLabelConfig,
  formatDate: (date: Date, options?: Intl.DateTimeFormatOptions) => string
): string {
  const startMs = parseBoundaryDate(config.startDate, 'start');
  const endMs = parseBoundaryDate(config.endDate, 'end');

  if (startMs === null && endMs === null) {
    return 'Always active';
  }

  const fmt = (ms: number) =>
    formatDate(new Date(ms), {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
    });

  if (startMs !== null && endMs !== null) {
    return `${fmt(startMs)} → ${fmt(endMs)}`;
  }
  if (startMs !== null) {
    return `From ${fmt(startMs)}`;
  }
  return `Until ${fmt(endMs!)}`;
}

function formatTargetSummary(config: TProductLabelConfig): string {
  const parts: string[] = [];
  const productCount = config.productIds.length;
  const includeProducts =
    config.targetMode === 'products' || config.targetMode === 'both';
  const includeAttribute =
    config.targetMode === 'attribute' || config.targetMode === 'both';

  if (includeProducts && productCount > 0) {
    parts.push(`${productCount} product${productCount === 1 ? '' : 's'}`);
  }

  if (includeAttribute && config.attributeRule?.attributeName) {
    const { attributeName, operator, value } = config.attributeRule;
    parts.push(`${attributeName} (${operator}) ${value}`);
  }

  return parts.length > 0 ? parts.join(' + ') : 'No targets configured';
}

const ProductLabels = () => {
  const intl = useIntl();
  const match = useRouteMatch();
  const { push } = useHistory();
  const { page, perPage } = usePaginationState();
  const tableSorting = useDataTableSortingState({
    key: 'key',
    order: 'asc',
  });
  const canManage = useIsAuthorized({
    demandedPermissions: [PERMISSIONS.Manage],
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<TStatusFilter>('all');

  const { labels, total, error, loading } = useProductLabelsFetcher({
    page,
    perPage,
    tableSorting,
  });

  const filteredLabels = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    return labels.filter((record) => {
      const status = getLabelStatus(record.config);
      if (statusFilter !== 'all' && status !== statusFilter) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      const searchableText = [
        record.key,
        record.config.name,
        record.config.text,
        record.config.attributeRule?.attributeName,
        record.config.attributeRule?.value,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return searchableText.includes(normalizedSearch);
    });
  }, [labels, searchTerm, statusFilter]);

  const existingKeys = useMemo(
    () => labels.map((record) => record.key),
    [labels]
  );

  if (error) {
    return (
      <ContentNotification type="error">
        <Text.Body>
          {intl.formatMessage(messages.fetchError)} ({getErrorMessage(error)})
        </Text.Body>
      </ContentNotification>
    );
  }

  return (
    <Spacings.Stack scale="l">
      <ApplicationPageTitle
        additionalParts={[intl.formatMessage(messages.title)]}
      />

      <Spacings.Inline alignItems="center" justifyContent="space-between">
        <Spacings.Stack scale="xs">
          <Text.Headline as="h2" intlMessage={messages.title} />
          <Text.Detail tone="secondary">
            {intl.formatMessage(messages.subtitle)}
          </Text.Detail>
        </Spacings.Stack>

        <PrimaryButton
          label={intl.formatMessage(messages.createButton)}
          iconLeft={<PlusBoldIcon />}
          isDisabled={!canManage}
          onClick={() => push(`${match.url}/new`)}
        />
      </Spacings.Inline>

      <Spacings.Inline alignItems="center" scale="m">
        <div style={{ flex: 1, maxWidth: 420 }}>
          <TextInput
            name="label-search"
            value={searchTerm}
            placeholder={intl.formatMessage(messages.searchPlaceholder)}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </div>
        <div style={{ width: 200 }}>
          <SelectInput
            name="label-status-filter"
            appearance="filter"
            value={statusFilter}
            options={STATUS_FILTER_OPTIONS}
            onChange={(event) => {
              const nextStatus =
                typeof event.target.value === 'string'
                  ? (event.target.value as TStatusFilter)
                  : 'all';
              setStatusFilter(nextStatus || 'all');
            }}
          />
        </div>
        <Text.Detail tone="secondary">
          Showing {filteredLabels.length} of {total}
        </Text.Detail>
      </Spacings.Inline>

      {loading && labels.length === 0 ? (
        <Spacings.Stack alignItems="center">
          <LoadingSpinner />
        </Spacings.Stack>
      ) : null}

      {!loading && total === 0 ? (
        <Card theme="light" type="flat">
          <Spacings.Stack scale="m" alignItems="flex-start">
            <Text.Subheadline as="h4">
              {intl.formatMessage(messages.emptyTitle)}
            </Text.Subheadline>
            <Text.Body tone="secondary">
              {intl.formatMessage(messages.emptyHint)}
            </Text.Body>
            <PrimaryButton
              label={intl.formatMessage(messages.createButton)}
              iconLeft={<PlusBoldIcon />}
              isDisabled={!canManage}
              onClick={() => push(`${match.url}/new`)}
            />
          </Spacings.Stack>
        </Card>
      ) : null}

      {total > 0 ? (
        <Spacings.Stack scale="l">
          {filteredLabels.length === 0 ? (
            <ContentNotification type="info">
              <Text.Body>
                No product labels match your current search or status filter.
              </Text.Body>
            </ContentNotification>
          ) : (
            <DataTable<TProductLabelRecord>
              isCondensed
              columns={COLUMNS}
              rows={filteredLabels}
              sortedBy={tableSorting.value.key}
              sortDirection={tableSorting.value.order}
              onSortChange={tableSorting.onChange}
              onRowClick={(row) =>
                push(`${match.url}/${encodeURIComponent(row.key)}`)
              }
              itemRenderer={(item, column) => {
                const status = getLabelStatus(item.config);
                switch (column.key) {
                  case 'name':
                    return (
                      <Spacings.Stack scale="xs">
                        <Text.Body isBold>{item.config.name}</Text.Body>
                        <Text.Detail tone="secondary">
                          {item.config.text}
                        </Text.Detail>
                      </Spacings.Stack>
                    );
                  case 'preview': {
                    const customStyle = parseCustomCss(item.config.customCss);
                    return (
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          borderRadius: 6,
                          backgroundColor: '#0f172a',
                          color: '#ffffff',
                          padding: '3px 8px',
                          fontSize: 11,
                          fontWeight: 700,
                          whiteSpace: 'nowrap',
                          ...customStyle,
                        }}
                      >
                        {item.config.text || 'LABEL'}
                      </span>
                    );
                  }
                  case 'status':
                    return (
                      <Stamp
                        tone={getStatusTone(status)}
                        label={status.toUpperCase()}
                        isCondensed
                      />
                    );
                  case 'position':
                    return formatPositionLabel(item.config.position);
                  case 'schedule':
                    return formatScheduleText(item.config, intl.formatDate);
                  case 'target':
                    return formatTargetSummary(item.config);
                  case 'priority':
                    return String(item.config.priority ?? 0);
                  case 'key':
                    return item.key;
                  default:
                    return null;
                }
              }}
            />
          )}

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
          <ProductLabelDetails
            mode="create"
            existingKeys={existingKeys}
            onClose={() => push(match.url)}
          />
        </SuspendedRoute>
        <SuspendedRoute path={`${match.path}/:key`}>
          <ProductLabelDetails mode="edit" onClose={() => push(match.url)} />
        </SuspendedRoute>
      </Switch>
    </Spacings.Stack>
  );
};
ProductLabels.displayName = 'ProductLabels';

export default ProductLabels;

