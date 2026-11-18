/// <reference path="../../../@types-extensions/graphql-ctp/index.d.ts" />

import type { ApolloError } from '@apollo/client';
import {
  useMcMutation,
  useMcQuery,
} from '@commercetools-frontend/application-shell';
import { GRAPHQL_TARGETS } from '@commercetools-frontend/constants';
import { STORE_LOCATOR_TYPE_KEY } from '../../constants';
import { extractErrorFromGraphQlResponse } from '../../helpers';
import {
  serializeStoreCustomValue,
  type TStore,
  type TStoreLocatorType,
} from '../../store-utils';
import CreateStoreMutation from './create-store.ctp.graphql';
import DeleteStoreMutation from './delete-store.ctp.graphql';
import FetchStoreDetailsQuery from './fetch-store-details.ctp.graphql';
import FetchStoreLocatorTypeQuery from './fetch-store-locator-type.ctp.graphql';
import FetchStoresQuery from './fetch-stores.ctp.graphql';
import UpdateStoreMutation from './update-store.ctp.graphql';

type TFetchStoresData = {
  stores: {
    total: number;
    count: number;
    offset: number;
    results: TStore[];
  };
};

type TFetchStoresVariables = {
  limit: number;
  offset: number;
  sort?: string[];
};

type TFetchStoreLocatorTypeData = {
  typeDefinition: TStoreLocatorType | null;
};

type TFetchStoreLocatorTypeVariables = {
  key: string;
};

type TFetchStoreDetailsData = {
  store: TStore | null;
};

type TFetchStoreDetailsVariables = {
  key: string;
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

type TCustomFieldInput = {
  name: string;
  value: string;
};

type TStoreDraft = {
  key: string;
  name: { locale: string; value: string }[];
  custom: {
    typeKey: string;
    fields: TCustomFieldInput[];
  };
};

type TStoreUpdateAction =
  | { setName: { name: { locale: string; value: string }[] } }
  | {
      setCustomType: {
        typeKey: string;
        fields: TCustomFieldInput[];
      };
    }
  | { setCustomField: { name: string; value: string | null } };

type TCreateStoreData = { createStore: TStore };
type TCreateStoreVariables = { draft: TStoreDraft };
type TUpdateStoreData = { updateStore: TStore };
type TUpdateStoreVariables = {
  id: string;
  version: number;
  actions: TStoreUpdateAction[];
};
type TDeleteStoreData = { deleteStore: { id: string; key: string } };
type TDeleteStoreVariables = { id: string; version: number };

function serializeFieldValue(name: string, value: string): string {
  return serializeStoreCustomValue(
    name === 'latitude' || name === 'longitude' ? Number(value) : value
  );
}

export const useStoresFetcher = ({
  limit,
  offset,
  sort,
}: TFetchStoresVariables): {
  stores: TStore[];
  total: number;
  error?: ApolloError;
  loading: boolean;
} => {
  const { data, error, loading } = useMcQuery<
    TFetchStoresData,
    TFetchStoresVariables
  >(FetchStoresQuery, {
    variables: { limit, offset, sort },
    fetchPolicy: 'cache-and-network',
    context: {
      target: GRAPHQL_TARGETS.COMMERCETOOLS_PLATFORM,
    },
  });

  return {
    stores: data?.stores.results ?? [],
    total: data?.stores.total ?? 0,
    error,
    loading,
  };
};

export const useStoreLocatorTypeFetcher = (): {
  type?: TStoreLocatorType | null;
  error?: ApolloError;
  loading: boolean;
} => {
  const { data, error, loading } = useMcQuery<
    TFetchStoreLocatorTypeData,
    TFetchStoreLocatorTypeVariables
  >(FetchStoreLocatorTypeQuery, {
    variables: { key: STORE_LOCATOR_TYPE_KEY },
    fetchPolicy: 'cache-and-network',
    context: {
      target: GRAPHQL_TARGETS.COMMERCETOOLS_PLATFORM,
    },
  });

  return {
    type: data?.typeDefinition,
    error,
    loading,
  };
};

export const useStoreDetailsFetcher = (
  key?: string
): {
  store?: TStore | null;
  error?: ApolloError;
  loading: boolean;
} => {
  const { data, error, loading } = useMcQuery<
    TFetchStoreDetailsData,
    TFetchStoreDetailsVariables
  >(FetchStoreDetailsQuery, {
    skip: !key,
    variables: { key: key ?? '' },
    fetchPolicy: 'cache-and-network',
    context: {
      target: GRAPHQL_TARGETS.COMMERCETOOLS_PLATFORM,
    },
  });

  return {
    store: data?.store,
    error,
    loading,
  };
};

export const useStoreSaver = () => {
  const [createStore, { loading: creating }] = useMcMutation<
    TCreateStoreData,
    TCreateStoreVariables
  >(CreateStoreMutation);
  const [updateStore, { loading: updating }] = useMcMutation<
    TUpdateStoreData,
    TUpdateStoreVariables
  >(UpdateStoreMutation);

  const execute = async ({
    store,
    values,
    locale,
  }: {
    store?: TStore;
    values: TStoreFormValues;
    locale: string;
  }): Promise<TStore> => {
    const name = [{ locale, value: values.name.trim() }];
    const fieldValues = [
      ['description', values.description.trim()],
      ['address', values.address.trim()],
      ['phone', values.phone.trim()],
      ['latitude', values.latitude.trim()],
      ['longitude', values.longitude.trim()],
    ] as const;

    try {
      if (!store) {
        const fields = fieldValues
          .filter(([, value]) => value !== '')
          .map(([fieldName, value]) => ({
            name: fieldName,
            value: serializeFieldValue(fieldName, value),
          }));
        const result = await createStore({
          context: { target: GRAPHQL_TARGETS.COMMERCETOOLS_PLATFORM },
          variables: {
            draft: {
              key: values.key.trim(),
              name,
              custom: {
                typeKey: STORE_LOCATOR_TYPE_KEY,
                fields,
              },
            },
          },
          refetchQueries: ['FetchStores'],
        });
        if (!result.data?.createStore) {
          throw new Error('The Store was not returned after creation.');
        }
        return result.data.createStore;
      }

      const currentTypeKey = store.custom?.type?.key;
      if (currentTypeKey && currentTypeKey !== STORE_LOCATOR_TYPE_KEY) {
        throw new Error(
          `This Store uses the "${currentTypeKey}" Custom Type. Add the locator fields to that Type before editing this Store; this app will not replace it.`
        );
      }

      const actions: TStoreUpdateAction[] = [{ setName: { name } }];
      if (!currentTypeKey) {
        const fields = fieldValues
          .filter(([, value]) => value !== '')
          .map(([fieldName, value]) => ({
            name: fieldName,
            value: serializeFieldValue(fieldName, value),
          }));
        actions.push({
          setCustomType: {
            typeKey: STORE_LOCATOR_TYPE_KEY,
            fields,
          },
        });
      } else {
        for (const [fieldName, value] of fieldValues) {
          const fieldExists = store.custom?.customFieldsRaw?.some(
            (field) => field.name === fieldName
          );
          if (!value && !fieldExists) continue;
          actions.push({
            setCustomField: {
              name: fieldName,
              value: value ? serializeFieldValue(fieldName, value) : null,
            },
          });
        }
      }

      const result = await updateStore({
        context: { target: GRAPHQL_TARGETS.COMMERCETOOLS_PLATFORM },
        variables: {
          id: store.id,
          version: store.version,
          actions,
        },
        refetchQueries: ['FetchStores'],
      });
      if (!result.data?.updateStore) {
        throw new Error('The Store was not returned after the update.');
      }
      return result.data.updateStore;
    } catch (graphQlResponse) {
      throw extractErrorFromGraphQlResponse(graphQlResponse);
    }
  };

  return {
    loading: creating || updating,
    execute,
  };
};

export const useStoreDeleter = () => {
  const [deleteStore, { loading }] = useMcMutation<
    TDeleteStoreData,
    TDeleteStoreVariables
  >(DeleteStoreMutation);

  const execute = async (store: TStore) => {
    try {
      return await deleteStore({
        context: { target: GRAPHQL_TARGETS.COMMERCETOOLS_PLATFORM },
        variables: {
          id: store.id,
          version: store.version,
        },
        refetchQueries: ['FetchStores'],
      });
    } catch (graphQlResponse) {
      throw extractErrorFromGraphQlResponse(graphQlResponse);
    }
  };

  return { loading, execute };
};
