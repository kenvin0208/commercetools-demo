import {
  getStoreCustomField,
  getStoreLocatorTypeIssue,
  serializeStoreCustomValue,
  type TStore,
} from './store-utils';

const store: TStore = {
  id: 'store-id',
  version: 1,
  key: 'sydney-flagship',
  nameAllLocales: [{ locale: 'en-AU', value: 'Sydney Flagship' }],
  custom: {
    type: { key: 'store-locator' },
    customFieldsRaw: [
      { name: 'address', value: '"1 Martin Place, Sydney"' },
      { name: 'latitude', value: '-33.8688' },
    ],
  },
};

describe('store locator utilities', () => {
  it('decodes string and numeric custom field values', () => {
    expect(getStoreCustomField(store, 'address')).toBe(
      '1 Martin Place, Sydney'
    );
    expect(getStoreCustomField(store, 'latitude')).toBe('-33.8688');
    expect(getStoreCustomField(store, 'phone')).toBe('');
  });

  it('reports a missing Custom Type', () => {
    expect(getStoreLocatorTypeIssue(null)).toContain(
      'Store locator Custom Type is missing'
    );
  });

  it('requires the complete Store locator field schema', () => {
    const type = {
      key: 'store-locator',
      resourceTypeIds: ['store'],
      fieldDefinitions: [
        { name: 'description', type: { name: 'String' } },
        { name: 'address', type: { name: 'String' } },
        { name: 'phone', type: { name: 'String' } },
        { name: 'latitude', type: { name: 'Number' } },
        { name: 'longitude', type: { name: 'Number' } },
      ],
    };

    expect(getStoreLocatorTypeIssue(type)).toBeUndefined();
    expect(
      getStoreLocatorTypeIssue({
        ...type,
        fieldDefinitions: type.fieldDefinitions.slice(0, 4),
      })
    ).toContain('longitude (Number)');
  });

  it('serializes coordinates as numbers', () => {
    expect(serializeStoreCustomValue(-33.8688)).toBe('-33.8688');
    expect(serializeStoreCustomValue('Sydney')).toBe('"Sydney"');
  });
});
