/// <reference path="../../../@types-extensions/graphql-ctp/index.d.ts" />

import { useMemo } from 'react';
import type { ApolloError } from '@apollo/client';
import {
  useMcMutation,
  useMcQuery,
} from '@commercetools-frontend/application-shell';
import { GRAPHQL_TARGETS } from '@commercetools-frontend/constants';
import type { TDataTableSortingState } from '@commercetools-uikit/hooks';
import { extractErrorFromGraphQlResponse } from '../../helpers';
import {
  PRODUCT_LABELS_CONTAINER,
  normalizeCustomObjectValue,
  type TProductLabelConfig,
  type TProductLabelRecord,
} from '../../label-utils';
import DeleteProductLabelMutation from './delete-product-label.ctp.graphql';
import FetchProductLabelDetailsQuery from './fetch-product-label-details.ctp.graphql';
import FetchProductLabelsQuery from './fetch-product-labels.ctp.graphql';
import FetchProductTypesQuery from './fetch-product-types.ctp.graphql';
import FetchProductsQuery from './fetch-products.ctp.graphql';
import UpsertProductLabelMutation from './upsert-product-label.ctp.graphql';

type RawCustomObject = {
  id: string;
  key: string;
  version: number;
  container: string;
  createdAt: string;
  lastModifiedAt: string;
  value: unknown;
};

type FetchProductLabelsQueryData = {
  customObjects: {
    total: number;
    count: number;
    offset: number;
    results: RawCustomObject[];
  };
};

type FetchProductLabelsQueryVars = {
  container: string;
  limit?: number;
  offset?: number;
  sort?: string[];
};

type FetchProductLabelDetailsQueryData = {
  customObject: RawCustomObject | null;
};

type FetchProductLabelDetailsQueryVars = {
  container: string;
  key: string;
};

type UpsertProductLabelMutationData = {
  createOrUpdateCustomObject: RawCustomObject;
};

type UpsertProductLabelMutationVars = {
  draft: {
    container: string;
    key: string;
    value: string;
    version?: number;
  };
};

type DeleteProductLabelMutationData = {
  deleteCustomObject: {
    id: string;
    key: string;
  } | null;
};

type DeleteProductLabelMutationVars = {
  container: string;
  key: string;
  version?: number;
};

export type TLocalizedLabelEntry = {
  locale: string;
  value: string;
};

export type TEnumOption = {
  key: string;
  label?: string;
  labelAllLocales?: TLocalizedLabelEntry[];
};

export type TProductTypeAttributeDefinition = {
  name: string;
  labelAllLocales?: TLocalizedLabelEntry[];
  type: {
    name: string;
    values?: {
      results: TEnumOption[];
    };
    elementType?: {
      name: string;
      values?: {
        results: TEnumOption[];
      };
    };
  };
};

export type TProductTypeOption = {
  id: string;
  key?: string;
  name: string;
  attributeDefinitions: {
    results: TProductTypeAttributeDefinition[];
  };
};

type FetchProductTypesQueryData = {
  productTypes: {
    total: number;
    results: TProductTypeOption[];
  };
};

type RawProductDataSnapshot = {
  nameAllLocales?: TLocalizedLabelEntry[];
  masterVariant?: {
    sku?: string;
    images?: { url: string }[];
  };
};

export type TRawCatalogProduct = {
  id: string;
  key?: string;
  masterData?: {
    current?: RawProductDataSnapshot | null;
    staged?: RawProductDataSnapshot | null;
  };
};

type FetchProductsQueryData = {
  products: {
    total: number;
    count: number;
    offset: number;
    results: TRawCatalogProduct[];
  };
};

type PaginationAndSortingProps = {
  page: { value: number };
  perPage: { value: number };
  tableSorting: TDataTableSortingState;
};

function toProductLabelRecord(item: RawCustomObject): TProductLabelRecord {
  return {
    id: item.id,
    customObjectId: item.id,
    key: item.key,
    version: item.version,
    createdAt: item.createdAt,
    lastModifiedAt: item.lastModifiedAt,
    config: normalizeCustomObjectValue(item.key, item.value, {
      createdAt: item.createdAt,
      lastModifiedAt: item.lastModifiedAt,
    }),
  };
}

export const useProductLabelsFetcher = ({
  page,
  perPage,
  tableSorting,
}: PaginationAndSortingProps): {
  labels: TProductLabelRecord[];
  total: number;
  error?: ApolloError;
  loading: boolean;
  refetch: () => Promise<unknown>;
} => {
  const sortKey = tableSorting.value.key === 'key' ? 'key' : 'lastModifiedAt';
  const { data, error, loading, refetch } = useMcQuery<
    FetchProductLabelsQueryData,
    FetchProductLabelsQueryVars
  >(FetchProductLabelsQuery, {
    variables: {
      container: PRODUCT_LABELS_CONTAINER,
      limit: perPage.value,
      offset: (page.value - 1) * perPage.value,
      sort: [`${sortKey} ${tableSorting.value.order}`],
    },
    fetchPolicy: 'cache-and-network',
    context: {
      target: GRAPHQL_TARGETS.COMMERCETOOLS_PLATFORM,
    },
  });

  const rawResults = data?.customObjects?.results;
  const labels = useMemo(
    () => (rawResults ?? []).map(toProductLabelRecord),
    [rawResults]
  );

  return {
    labels,
    total: data?.customObjects?.total ?? 0,
    error,
    loading,
    refetch,
  };
};

export const useProductLabelDetailsFetcher = (
  key?: string
): {
  labelRecord?: TProductLabelRecord | null;
  error?: ApolloError;
  loading: boolean;
} => {
  const { data, error, loading } = useMcQuery<
    FetchProductLabelDetailsQueryData,
    FetchProductLabelDetailsQueryVars
  >(FetchProductLabelDetailsQuery, {
    skip: !key,
    variables: {
      container: PRODUCT_LABELS_CONTAINER,
      key: key ?? '',
    },
    fetchPolicy: 'cache-and-network',
    context: {
      target: GRAPHQL_TARGETS.COMMERCETOOLS_PLATFORM,
    },
  });

  const labelRecord = useMemo(() => {
    if (data?.customObject) {
      return toProductLabelRecord(data.customObject);
    }
    if (data?.customObject === null) {
      return null;
    }
    return undefined;
  }, [data?.customObject]);

  return {
    labelRecord,
    error,
    loading,
  };
};

export const useProductLabelSaver = () => {
  const [upsertLabel, { loading }] = useMcMutation<
    UpsertProductLabelMutationData,
    UpsertProductLabelMutationVars
  >(UpsertProductLabelMutation);

  const execute = async ({
    key,
    config,
    version,
  }: {
    key: string;
    config: TProductLabelConfig;
    version?: number;
  }) => {
    try {
      const result = await upsertLabel({
        context: {
          target: GRAPHQL_TARGETS.COMMERCETOOLS_PLATFORM,
        },
        variables: {
          draft: {
            container: PRODUCT_LABELS_CONTAINER,
            key,
            value: JSON.stringify(config),
            ...(typeof version === 'number' ? { version } : {}),
          },
        },
        refetchQueries: ['FetchProductLabels'],
      });

      const saved = result.data?.createOrUpdateCustomObject;
      return saved ? toProductLabelRecord(saved) : null;
    } catch (graphQlResponse) {
      throw extractErrorFromGraphQlResponse(graphQlResponse);
    }
  };

  return {
    loading,
    execute,
  };
};

export const useProductLabelDeleter = () => {
  const [deleteLabel, { loading }] = useMcMutation<
    DeleteProductLabelMutationData,
    DeleteProductLabelMutationVars
  >(DeleteProductLabelMutation);

  const execute = async ({
    key,
    version,
  }: {
    key: string;
    version?: number;
  }) => {
    try {
      return await deleteLabel({
        context: {
          target: GRAPHQL_TARGETS.COMMERCETOOLS_PLATFORM,
        },
        variables: {
          container: PRODUCT_LABELS_CONTAINER,
          key,
          ...(typeof version === 'number' ? { version } : {}),
        },
        refetchQueries: ['FetchProductLabels'],
      });
    } catch (graphQlResponse) {
      throw extractErrorFromGraphQlResponse(graphQlResponse);
    }
  };

  return {
    loading,
    execute,
  };
};

export const useProductTypesFetcher = (): {
  productTypes: TProductTypeOption[];
  error?: ApolloError;
  loading: boolean;
} => {
  const { data, error, loading } = useMcQuery<
    FetchProductTypesQueryData,
    { limit?: number }
  >(FetchProductTypesQuery, {
    variables: {
      limit: 500,
    },
    context: {
      target: GRAPHQL_TARGETS.COMMERCETOOLS_PLATFORM,
    },
  });

  const rawProductTypes = data?.productTypes?.results;
  const productTypes = useMemo(() => rawProductTypes ?? [], [rawProductTypes]);

  return {
    productTypes,
    error,
    loading,
  };
};

export const useProductsFetcher = (
  limit = 100
): {
  products: TRawCatalogProduct[];
  total: number;
  error?: ApolloError;
  loading: boolean;
} => {
  const { data, error, loading } = useMcQuery<
    FetchProductsQueryData,
    { limit?: number; offset?: number; where?: string }
  >(FetchProductsQuery, {
    variables: {
      limit,
      offset: 0,
    },
    context: {
      target: GRAPHQL_TARGETS.COMMERCETOOLS_PLATFORM,
    },
  });

  const rawProducts = data?.products?.results;
  const products = useMemo(() => rawProducts ?? [], [rawProducts]);

  return {
    products,
    total: data?.products?.total ?? 0,
    error,
    loading,
  };
};
