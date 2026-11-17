import type { CSSProperties } from 'react';

export const PRODUCT_LABELS_CONTAINER = 'product-labels';

export type TProductLabelPosition =
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right';

export type TProductLabelTargetMode = 'products' | 'attribute' | 'both';

export type TProductLabelAttributeOperator = 'equals' | 'contains' | 'in';

export type TProductLabelAttributeRule = {
  attributeName: string;
  operator: TProductLabelAttributeOperator;
  value: string;
  attributeLabel?: string;
  productTypeId?: string;
  productTypeName?: string;
};

export type TProductLabelTargetProduct = {
  id: string;
  key?: string;
  name?: string;
};

export type TProductLabelConfig = {
  id: string;
  name: string;
  text: string;
  enabled: boolean;
  startDate?: string;
  endDate?: string;
  position: TProductLabelPosition;
  customCss?: string;
  priority?: number;
  targetMode: TProductLabelTargetMode;
  productIds: string[];
  productKeys?: string[];
  products?: TProductLabelTargetProduct[];
  attributeRule?: TProductLabelAttributeRule;
  createdAt?: string;
  updatedAt?: string;
};

export type TProductLabelRecord = {
  id: string;
  customObjectId: string;
  key: string;
  version: number;
  createdAt: string;
  lastModifiedAt: string;
  config: TProductLabelConfig;
};

export type TProductLabelStatus =
  | 'active'
  | 'scheduled'
  | 'expired'
  | 'disabled';

export const POSITION_OPTIONS: {
  value: TProductLabelPosition;
  label: string;
}[] = [
  { value: 'top-left', label: 'Top left' },
  { value: 'top-right', label: 'Top right' },
  { value: 'bottom-left', label: 'Bottom left' },
  { value: 'bottom-right', label: 'Bottom right' },
];

export const TARGET_MODE_OPTIONS: {
  value: TProductLabelTargetMode;
  label: string;
}[] = [
  { value: 'products', label: 'Specific products' },
  { value: 'attribute', label: 'Products sharing an attribute' },
  { value: 'both', label: 'Both specific products & attribute rule' },
];

export const OPERATOR_OPTIONS: {
  value: TProductLabelAttributeOperator;
  label: string;
}[] = [
  { value: 'equals', label: 'Equals' },
  { value: 'contains', label: 'Contains' },
  { value: 'in', label: 'In comma-separated list' },
];

export const CSS_STYLE_PRESETS: { name: string; css: string }[] = [
  {
    name: 'Sale Red Pill',
    css: 'background: #dc2626;\ncolor: #ffffff;\nborder-radius: 9999px;\npadding: 4px 10px;\nfont-size: 11px;\nfont-weight: 700;',
  },
  {
    name: 'New Dark Badge',
    css: 'background: #0f172a;\ncolor: #ffffff;\nborder-radius: 6px;\npadding: 4px 9px;\nfont-size: 11px;\nletter-spacing: 0.08em;',
  },
  {
    name: 'Limited Gold',
    css: 'background: linear-gradient(135deg, #f59e0b, #d97706);\ncolor: #ffffff;\nborder-radius: 4px;\npadding: 4px 10px;\nfont-weight: 700;',
  },
  {
    name: 'Eco Green',
    css: 'background: #059669;\ncolor: #ffffff;\nborder-radius: 9999px;\npadding: 4px 10px;\nfont-size: 11px;',
  },
  {
    name: 'Minimal Light',
    css: 'background: rgba(255, 255, 255, 0.94);\ncolor: #0f172a;\nborder: 1px solid #cbd5e1;\nborder-radius: 6px;\npadding: 4px 9px;',
  },
];

const VALID_POSITIONS = new Set<TProductLabelPosition>([
  'top-left',
  'top-right',
  'bottom-left',
  'bottom-right',
]);

const VALID_OPERATORS = new Set<TProductLabelAttributeOperator>([
  'equals',
  'contains',
  'in',
]);

const VALID_TARGET_MODES = new Set<TProductLabelTargetMode>([
  'products',
  'attribute',
  'both',
]);

const DATE_ONLY_REGEX = /^\d{4}-\d{2}-\d{2}$/;

const DANGEROUS_CSS_VALUE_REGEX =
  /(?:url\s*\(|expression\s*\(|javascript:|vbscript:|@import|behavior\s*:|-moz-binding|[<>])/i;

const SAFE_CSS_PROPERTY_REGEX =
  /^(?:--[a-zA-Z0-9_-]+|-?[a-z]+(?:-[a-z0-9]+)*)$/;

const DISALLOWED_CSS_PROPERTIES = new Set([
  'position',
  'top',
  'right',
  'bottom',
  'left',
  'inset',
  'z-index',
]);

export function slugifyLabelKey(input: string): string {
  const normalized = input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);

  if (normalized.length >= 2) {
    return normalized;
  }
  return `label-${Date.now().toString(36)}`;
}

export function parseBoundaryDate(
  value: string | undefined,
  boundary: 'start' | 'end'
): number | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  if (DATE_ONLY_REGEX.test(trimmed)) {
    const suffix = boundary === 'start' ? 'T00:00:00.000Z' : 'T23:59:59.999Z';
    const parsed = Date.parse(`${trimmed}${suffix}`);
    return Number.isNaN(parsed) ? null : parsed;
  }

  const parsed = Date.parse(trimmed);
  return Number.isNaN(parsed) ? null : parsed;
}

export function getLabelStatus(
  label: TProductLabelConfig,
  now: Date = new Date()
): TProductLabelStatus {
  if (!label.enabled) return 'disabled';
  const nowMs = now.getTime();
  const startMs = parseBoundaryDate(label.startDate, 'start');
  const endMs = parseBoundaryDate(label.endDate, 'end');

  if (startMs !== null && nowMs < startMs) return 'scheduled';
  if (endMs !== null && nowMs > endMs) return 'expired';
  return 'active';
}

export function normalizeCustomObjectValue(
  key: string,
  value: unknown,
  timestamps?: { createdAt?: string; lastModifiedAt?: string }
): TProductLabelConfig {
  const raw =
    value && typeof value === 'object'
      ? (value as Record<string, unknown>)
      : {};

  const text = typeof raw.text === 'string' ? raw.text : '';
  const name =
    typeof raw.name === 'string' && raw.name.trim() ? raw.name : text || key;

  const position = VALID_POSITIONS.has(raw.position as TProductLabelPosition)
    ? (raw.position as TProductLabelPosition)
    : 'top-left';

  const rawRule =
    raw.attributeRule && typeof raw.attributeRule === 'object'
      ? (raw.attributeRule as Record<string, unknown>)
      : null;

  const attributeRule =
    rawRule && typeof rawRule.attributeName === 'string'
      ? {
          attributeName: rawRule.attributeName,
          operator: VALID_OPERATORS.has(
            rawRule.operator as TProductLabelAttributeOperator
          )
            ? (rawRule.operator as TProductLabelAttributeOperator)
            : 'equals',
          value:
            typeof rawRule.value === 'string'
              ? rawRule.value
              : String(rawRule.value ?? ''),
          ...(typeof rawRule.attributeLabel === 'string'
            ? { attributeLabel: rawRule.attributeLabel }
            : {}),
          ...(typeof rawRule.productTypeId === 'string'
            ? { productTypeId: rawRule.productTypeId }
            : {}),
          ...(typeof rawRule.productTypeName === 'string'
            ? { productTypeName: rawRule.productTypeName }
            : {}),
        }
      : undefined;

  const productIds = Array.isArray(raw.productIds)
    ? raw.productIds.filter(
        (entry): entry is string =>
          typeof entry === 'string' && entry.trim().length > 0
      )
    : [];

  const productKeys = Array.isArray(raw.productKeys)
    ? raw.productKeys.filter(
        (entry): entry is string =>
          typeof entry === 'string' && entry.trim().length > 0
      )
    : undefined;

  const products = Array.isArray(raw.products)
    ? raw.products.flatMap((entry) => {
        if (!entry || typeof entry !== 'object') return [];
        const record = entry as Record<string, unknown>;
        if (typeof record.id !== 'string') return [];
        return [
          {
            id: record.id,
            ...(typeof record.key === 'string' ? { key: record.key } : {}),
            ...(typeof record.name === 'string' ? { name: record.name } : {}),
          },
        ];
      })
    : undefined;

  const targetMode: TProductLabelTargetMode = VALID_TARGET_MODES.has(
    raw.targetMode as TProductLabelTargetMode
  )
    ? (raw.targetMode as TProductLabelTargetMode)
    : attributeRule && productIds.length > 0
    ? 'both'
    : attributeRule
    ? 'attribute'
    : 'products';

  return {
    id: typeof raw.id === 'string' && raw.id.trim() ? raw.id : key,
    name,
    text,
    enabled: typeof raw.enabled === 'boolean' ? raw.enabled : true,
    startDate: typeof raw.startDate === 'string' ? raw.startDate : undefined,
    endDate: typeof raw.endDate === 'string' ? raw.endDate : undefined,
    position,
    customCss: typeof raw.customCss === 'string' ? raw.customCss : undefined,
    priority:
      typeof raw.priority === 'number' && Number.isFinite(raw.priority)
        ? raw.priority
        : 0,
    targetMode,
    productIds,
    productKeys,
    products,
    attributeRule,
    createdAt:
      typeof raw.createdAt === 'string' ? raw.createdAt : timestamps?.createdAt,
    updatedAt:
      typeof raw.updatedAt === 'string'
        ? raw.updatedAt
        : timestamps?.lastModifiedAt,
  };
}

function cssPropertyToCamelCase(property: string): string {
  if (property.startsWith('--')) return property;
  const normalized = property.toLowerCase();
  if (normalized.startsWith('-webkit-')) {
    return `Webkit${normalized
      .slice(8)
      .replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase())}`;
  }
  if (normalized.startsWith('-moz-')) {
    return `Moz${normalized
      .slice(5)
      .replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase())}`;
  }
  if (normalized.startsWith('-ms-')) {
    return `ms${normalized
      .slice(4)
      .replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase())}`;
  }
  return normalized.replace(/-([a-z])/g, (_, letter: string) =>
    letter.toUpperCase()
  );
}

function stripOptionalBlockWrapper(css: string): string {
  const withoutComments = css.replace(/\/\*[\s\S]*?\*\//g, '').trim();
  if (!withoutComments) return '';

  const openBraceIndex = withoutComments.indexOf('{');
  const closeBraceIndex = withoutComments.lastIndexOf('}');
  if (openBraceIndex !== -1 && closeBraceIndex > openBraceIndex) {
    return withoutComments.slice(openBraceIndex + 1, closeBraceIndex).trim();
  }
  return withoutComments;
}

function splitCssDeclarations(input: string): string[] {
  const declarations: string[] = [];
  let current = '';
  let parenDepth = 0;
  let quote: '"' | "'" | null = null;

  for (let index = 0; index < input.length; index += 1) {
    const char = input[index];
    const previousChar = index > 0 ? input[index - 1] : '';

    if (quote) {
      current += char;
      if (char === quote && previousChar !== '\\') {
        quote = null;
      }
      continue;
    }

    if (char === '"' || char === "'") {
      quote = char;
      current += char;
      continue;
    }

    if (char === '(') {
      parenDepth += 1;
      current += char;
      continue;
    }

    if (char === ')' && parenDepth > 0) {
      parenDepth -= 1;
      current += char;
      continue;
    }

    if (char === ';' && parenDepth === 0) {
      if (current.trim()) {
        declarations.push(current.trim());
      }
      current = '';
      continue;
    }

    current += char;
  }

  if (current.trim()) {
    declarations.push(current.trim());
  }

  return declarations;
}

export function parseCustomCss(customCss?: string): CSSProperties {
  if (!customCss || typeof customCss !== 'string') return {};
  const body = stripOptionalBlockWrapper(customCss);
  if (!body) return {};

  const style: Record<string, string> = {};

  for (const declaration of splitCssDeclarations(body)) {
    const colonIndex = declaration.indexOf(':');
    if (colonIndex <= 0) continue;

    const rawProperty = declaration.slice(0, colonIndex).trim();
    const rawValue = declaration.slice(colonIndex + 1).trim();

    if (!rawProperty || !rawValue) continue;
    if (!SAFE_CSS_PROPERTY_REGEX.test(rawProperty)) continue;
    if (DISALLOWED_CSS_PROPERTIES.has(rawProperty.toLowerCase())) continue;
    if (DANGEROUS_CSS_VALUE_REGEX.test(rawValue)) continue;

    const cleanedValue = rawValue.replace(/\s*!important\s*$/i, '').trim();
    if (!cleanedValue) continue;

    style[cssPropertyToCamelCase(rawProperty)] = cleanedValue;
  }

  return style as CSSProperties;
}

export function formatPositionLabel(position: TProductLabelPosition): string {
  return (
    POSITION_OPTIONS.find((option) => option.value === position)?.label ??
    'Top left'
  );
}
