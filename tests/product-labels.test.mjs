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
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.ReactJSX,
      esModuleInterop: true,
    },
  }).outputText;

  const compiledModule = { exports: {} };
  const localRequire = (name) => {
    if (Object.hasOwn(mocks, name)) return mocks[name];
    if (name.startsWith('.')) return load(path.resolve(path.dirname(filename), `${name}.ts`), mocks);
    return requireDependency(name);
  };

  const context = vm.createContext({
    module: compiledModule,
    exports: compiledModule.exports,
    require: localRequire,
    console,
    process,
  });

  new vm.Script(source, { filename }).runInContext(context);
  return compiledModule.exports;
}

const labelsLib = load('src/lib/product-labels.ts');

test('isLabelActive evaluates enabled state, text, and inclusive start/end dates', () => {
  const baseLabel = {
    id: 'summer-sale',
    name: 'Summer Sale',
    text: 'SALE -20%',
    enabled: true,
    position: 'top-left',
    targetMode: 'products',
    productIds: ['prod-1'],
  };

  assert.equal(labelsLib.isLabelActive(baseLabel, new Date('2026-11-11T12:00:00Z')), true);
  assert.equal(labelsLib.isLabelActive({ ...baseLabel, enabled: false }, new Date('2026-11-11T12:00:00Z')), false);
  assert.equal(labelsLib.isLabelActive({ ...baseLabel, text: '   ' }, new Date('2026-11-11T12:00:00Z')), false);

  const scheduled = {
    ...baseLabel,
    startDate: '2026-11-10',
    endDate: '2026-11-12',
  };

  assert.equal(labelsLib.isLabelActive(scheduled, new Date('2026-11-09T23:59:59Z')), false);
  assert.equal(labelsLib.isLabelActive(scheduled, new Date('2026-11-10T00:00:00Z')), true);
  assert.equal(labelsLib.isLabelActive(scheduled, new Date('2026-11-12T23:59:59Z')), true);
  assert.equal(labelsLib.isLabelActive(scheduled, new Date('2026-11-13T00:00:00Z')), false);

  const isoScheduled = {
    ...baseLabel,
    startDate: '2026-11-11T08:00:00Z',
    endDate: '2026-11-11T10:00:00Z',
  };
  assert.equal(labelsLib.isLabelActive(isoScheduled, new Date('2026-11-11T07:59:59Z')), false);
  assert.equal(labelsLib.isLabelActive(isoScheduled, new Date('2026-11-11T09:00:00Z')), true);
  assert.equal(labelsLib.isLabelActive(isoScheduled, new Date('2026-11-11T10:00:01Z')), false);
});

test('doesAttributeRuleMatch handles text, ltext, enum, lenum, boolean, number, set, and operators', () => {
  const product = {
    id: 'prod-1',
    key: 'aurora-lamp',
    brand: 'Lumina',
    attributes: [
      { name: 'color', value: { key: 'midnight-blue', label: { 'en-AU': 'Midnight Blue', 'en-US': 'Midnight Blue' } } },
      { name: 'material', value: { 'en-AU': 'Recycled Ceramic' } },
      { name: 'ecoFriendly', value: true },
      { name: 'discountPercent', value: 25 },
      { name: 'tags', value: [{ key: 'new', label: 'New Arrival' }, 'Bestseller'] },
    ],
  };

  assert.equal(
    labelsLib.doesAttributeRuleMatch({ attributeName: 'brand', operator: 'equals', value: 'lumina' }, product),
    true,
  );
  assert.equal(
    labelsLib.doesAttributeRuleMatch({ attributeName: 'color', operator: 'equals', value: 'midnight-blue' }, product),
    true,
  );
  assert.equal(
    labelsLib.doesAttributeRuleMatch({ attributeName: 'color', operator: 'equals', value: 'Midnight Blue' }, product),
    true,
  );
  assert.equal(
    labelsLib.doesAttributeRuleMatch({ attributeName: 'material', operator: 'contains', value: 'ceramic' }, product),
    true,
  );
  assert.equal(
    labelsLib.doesAttributeRuleMatch({ attributeName: 'ecoFriendly', operator: 'equals', value: 'true' }, product),
    true,
  );
  assert.equal(
    labelsLib.doesAttributeRuleMatch({ attributeName: 'discountPercent', operator: 'in', value: '15, 25, 30' }, product),
    true,
  );
  assert.equal(
    labelsLib.doesAttributeRuleMatch({ attributeName: 'tags', operator: 'equals', value: 'bestseller' }, product),
    true,
  );
  assert.equal(
    labelsLib.doesAttributeRuleMatch({ attributeName: 'tags', operator: 'equals', value: 'clearance' }, product),
    false,
  );
});

test('resolveLabelsForProduct resolves matching product/attribute labels sorted by priority', () => {
  const product = {
    id: 'prod-123',
    key: 'stone-chair',
    attributes: [{ name: 'collection', value: 'summer-2026' }],
  };

  const labels = [
    {
      id: 'attr-label',
      name: 'Summer Collection',
      text: 'Summer',
      enabled: true,
      position: 'top-left',
      priority: 5,
      targetMode: 'attribute',
      productIds: [],
      attributeRule: { attributeName: 'collection', operator: 'equals', value: 'summer-2026' },
    },
    {
      id: 'prod-label',
      name: 'Top Pick',
      text: 'Top Pick',
      enabled: true,
      position: 'top-left',
      priority: 20,
      targetMode: 'products',
      productIds: ['prod-123'],
    },
    {
      id: 'both-label',
      name: 'Limited',
      text: 'Limited',
      enabled: true,
      position: 'bottom-right',
      priority: 1,
      targetMode: 'both',
      productIds: [],
      attributeRule: { attributeName: 'collection', operator: 'contains', value: 'summer' },
    },
    {
      id: 'expired-label',
      name: 'Expired',
      text: 'Old Deal',
      enabled: true,
      endDate: '2026-01-01',
      position: 'top-right',
      priority: 50,
      targetMode: 'products',
      productIds: ['prod-123'],
    },
  ];

  const resolved = labelsLib.resolveLabelsForProduct(labels, product, new Date('2026-11-11T10:00:00Z'));
  assert.deepEqual(
    resolved.map((item) => item.id),
    ['prod-label', 'attr-label', 'both-label'],
  );
});

test('parseCustomCss converts safe CSS declarations and strips unsafe directives', () => {
  const parsed = labelsLib.parseCustomCss(
    `
      .my-label {
        background: linear-gradient(135deg, #ef4444, #b91c1c);
        color: #ffffff !important;
        border-radius: 9999px;
        font-size: 11px;
        padding: 4px 10px;
        position: fixed;
        top: 0;
        background-image: url("javascript:alert(1)");
      }
    `,
  );

  assert.equal(parsed.background, 'linear-gradient(135deg, #ef4444, #b91c1c)');
  assert.equal(parsed.color, '#ffffff');
  assert.equal(parsed.borderRadius, '9999px');
  assert.equal(parsed.fontSize, '11px');
  assert.equal(parsed.padding, '4px 10px');
  assert.equal(parsed.position, undefined);
  assert.equal(parsed.top, undefined);
  assert.equal(parsed.backgroundImage, undefined);
});

test('ProductImagePanel and ProductDetailPage render product labels on PDP', async () => {
  const React = requireDependency('react');
  const { renderToStaticMarkup } = requireDependency('react-dom/server');

  const overlayModule = load('src/components/product/ProductLabelsOverlay.tsx', {
    '@/src/lib/product-labels': labelsLib,
  });

  const { ProductImagePanel } = load('src/components/product/ProductImagePanel.tsx', {
    'next/image': {
      __esModule: true,
      default: ({ src, alt }) => React.createElement('img', { src, alt }),
    },
    '@/src/components/product/ProductLabelsOverlay': overlayModule,
  });

  const sampleLabels = [
    {
      id: 'vip-drop',
      text: 'VIP Drop',
      position: 'top-right',
      customCss: 'background: #dc2626; color: #ffffff;',
      priority: 10,
    },
    {
      id: 'eco-pick',
      text: 'Eco Pick',
      position: 'bottom-left',
      customCss: 'background: #16a34a;',
      priority: 5,
    },
  ];

  const panelHtml = renderToStaticMarkup(
    React.createElement(ProductImagePanel, {
      image: '/aurora.jpg',
      name: 'Aurora Lamp',
      labels: sampleLabels,
    }),
  );

  assert.match(panelHtml, /data-label-position="top-right"/);
  assert.match(panelHtml, /data-product-label-id="vip-drop"/);
  assert.match(panelHtml, /VIP Drop/);
  assert.match(panelHtml, /background:#dc2626/);
  assert.match(panelHtml, /data-label-position="bottom-left"/);
  assert.match(panelHtml, /Eco Pick/);

  const detailPageModule = load('src/app/products/[slug]/page.tsx', {
    'next/link': {
      __esModule: true,
      default: ({ href, children, ...props }) => React.createElement('a', { href, ...props }, children),
    },
    'next/navigation': {
      notFound: () => {
        throw new Error('NOT_FOUND');
      },
    },
    '@/src/lib/commercetools/products': {
      getProductByKey: async () => null,
      getProductById: async () => null,
      getProductBySlug: async (slug) =>
        slug === 'aurora-lamp-slug'
          ? {
              id: 'prod-1',
              key: 'aurora-key',
              variantId: 1,
              name: { 'en-US': 'Aurora Lamp' },
              slug: { 'en-US': 'aurora-lamp-slug' },
              image: '/aurora.jpg',
              labels: sampleLabels,
            }
          : null,
      getRelatedProducts: async () => [],
    },
    '@/src/utils/localized': {
      getLocalizedValue: (value) => value?.['en-US'] ?? '',
    },
    '@/src/components/product/ProductImagePanel': { ProductImagePanel },
    '@/src/components/product/ProductDetailsPanel': {
      ProductDetailsPanel: ({ product }) => React.createElement('div', null, product.name['en-US']),
    },
    '@/src/components/site/RelatedProductsSlider': {
      RelatedProductsSlider: () => null,
    },
  });

  const pageElement = await detailPageModule.default({
    params: Promise.resolve({ slug: 'aurora-lamp-slug' }),
  });
  const pageHtml = renderToStaticMarkup(pageElement);

  assert.match(pageHtml, /data-product-label-id="vip-drop"/);
  assert.match(pageHtml, /data-product-label-id="eco-pick"/);
});

