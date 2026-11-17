import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import ts from 'typescript';
import { createRequire } from 'node:module';

const requireDependency = createRequire(import.meta.url);

function load(file, mocks = {}) {
  const filename = path.resolve(file);
  const source = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText;
  const compiledModule = { exports: {} };
  const localRequire = name => {
    if (Object.hasOwn(mocks, name)) return mocks[name];
    if (name.startsWith('.')) return load(path.resolve(path.dirname(filename), `${name}.ts`), mocks);
    return requireDependency(name);
  };
  const context = vm.createContext({ module: compiledModule, exports: compiledModule.exports, require: localRequire, console, process });
  new vm.Script(source, { filename }).runInContext(context);
  return compiledModule.exports;
}

test('Australia market selects AUD prices scoped to Australia for every product query', async () => {
  const marketModule = load('src/lib/market.ts');
  const market = marketModule.MARKETS.AU;
  assert.equal(market.currency, 'AUD');
  assert.equal(market.country, 'AU');

  const calls = [];
  const rawProduct = {
    id: 'product-1',
    key: 'sample-product',
    masterData: {
      current: {
        id: 'product-1',
        key: 'sample-product',
        name: { 'en-AU': 'Sample product' },
        slug: { 'en-AU': 'sample-product' },
        masterVariant: {
          id: 1,
          prices: [
            { value: { centAmount: 12500, currencyCode: 'AUD' } },
            { value: { centAmount: 9900, currencyCode: 'EUR' } },
          ],
        },
        variants: [],
      },
    },
  };

  function endpoint(segments = []) {
    return new Proxy({}, {
      get(_, name) {
        if (name === 'then') return undefined;
        if (name === 'execute') {
          return async () => {
            const get = segments.find(([method]) => method === 'get');
            calls.push(get?.[1]?.queryArgs);
            return { body: { results: [rawProduct], total: 1 } };
          };
        }
        return (...args) => endpoint([...segments, [name, ...args]]);
      },
    });
  }

  const apiRoot = new Proxy({}, {
    get(_, name) {
      if (name === 'then') return undefined;
      return (...args) => endpoint([[name, ...args]]);
    },
  });
  const products = load('src/lib/commercetools/products.ts', {
    '@/src/lib/commercetools/client': { apiRoot, hasCtpCredentials: true },
    '@/src/constants': { DEFAULT_CURRENCY: 'AUD' },
    '@/src/utils/localized': { getLocalizedValue: values => Object.values(values)[0] },
    '@/src/lib/market-server': { getCurrentMarket: async () => market },
    '@/src/lib/commercetools/product-labels': { getProductLabels: async () => [] },
    '@/src/lib/product-labels': { resolveLabelsForProduct: () => [] },
  });

  await products.getFeaturedProducts();
  await products.searchProducts({ query: 'sample' });
  await products.getProductByKey('sample-product');
  await products.getProductBySlug('sample-product');
  await products.getProductById('product-1');

  assert.equal(calls.length, 5);
  for (const queryArgs of calls) {
    assert.equal(queryArgs.priceCurrency, 'AUD');
    assert.equal(queryArgs.priceCountry, 'AU');
  }
});
