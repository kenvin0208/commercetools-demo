export type ProductLabelPosition =
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right";

export type ProductLabelTargetMode = "products" | "attribute" | "both";

export type ProductLabelAttributeOperator = "equals" | "contains" | "in";

export type ProductLabelAttributeRule = {
  attributeName: string;
  operator: ProductLabelAttributeOperator;
  value: string;
  attributeLabel?: string;
  productTypeId?: string;
  productTypeName?: string;
};

export type ProductLabelTargetProduct = {
  id: string;
  key?: string;
  name?: string;
};

export type ProductLabelConfig = {
  id: string;
  name: string;
  text: string;
  enabled: boolean;
  startDate?: string;
  endDate?: string;
  position: ProductLabelPosition;
  customCss?: string;
  priority?: number;
  targetMode: ProductLabelTargetMode;
  productIds: string[];
  productKeys?: string[];
  products?: ProductLabelTargetProduct[];
  attributeRule?: ProductLabelAttributeRule;
  createdAt?: string;
  updatedAt?: string;
};

export type ProductLabelBadge = {
  id: string;
  text: string;
  position: ProductLabelPosition;
  customCss?: string;
  priority: number;
};

export type ProductAttributeEntry = {
  name: string;
  value: unknown;
};

export type LabelMatchableProduct = {
  id?: string;
  key?: string;
  brand?: string;
  attributes?: ProductAttributeEntry[];
};

export const PRODUCT_LABELS_CONTAINER = "product-labels";

const VALID_POSITIONS = new Set<ProductLabelPosition>([
  "top-left",
  "top-right",
  "bottom-left",
  "bottom-right",
]);

const VALID_OPERATORS = new Set<ProductLabelAttributeOperator>([
  "equals",
  "contains",
  "in",
]);

const VALID_TARGET_MODES = new Set<ProductLabelTargetMode>([
  "products",
  "attribute",
  "both",
]);

const DATE_ONLY_REGEX = /^\d{4}-\d{2}-\d{2}$/;

const DANGEROUS_CSS_VALUE_REGEX =
  /(?:url\s*\(|expression\s*\(|javascript:|vbscript:|@import|behavior\s*:|-moz-binding|[<>])/i;

const SAFE_CSS_PROPERTY_REGEX = /^(?:--[a-zA-Z0-9_-]+|-?[a-z]+(?:-[a-z0-9]+)*)$/;

const DISALLOWED_CSS_PROPERTIES = new Set([
  "position",
  "top",
  "right",
  "bottom",
  "left",
  "inset",
  "z-index",
]);

export function normalizeLabelPosition(value: unknown): ProductLabelPosition {
  if (typeof value === "string" && VALID_POSITIONS.has(value as ProductLabelPosition)) {
    return value as ProductLabelPosition;
  }
  return "top-left";
}

function parseBoundaryDate(value: string | undefined, boundary: "start" | "end"): number | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  if (DATE_ONLY_REGEX.test(trimmed)) {
    const suffix = boundary === "start" ? "T00:00:00.000Z" : "T23:59:59.999Z";
    const parsed = Date.parse(`${trimmed}${suffix}`);
    return Number.isNaN(parsed) ? null : parsed;
  }

  const parsed = Date.parse(trimmed);
  return Number.isNaN(parsed) ? null : parsed;
}

export function isLabelActive(label: ProductLabelConfig, now: Date = new Date()): boolean {
  if (!label.enabled) return false;
  if (!label.text || !label.text.trim()) return false;

  const nowMs = now.getTime();
  const startMs = parseBoundaryDate(label.startDate, "start");
  if (startMs !== null && nowMs < startMs) return false;

  const endMs = parseBoundaryDate(label.endDate, "end");
  if (endMs !== null && nowMs > endMs) return false;

  return true;
}

export function extractAttributeComparableValues(value: unknown): string[] {
  if (value === null || value === undefined) return [];

  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed ? [trimmed] : [];
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return [String(value)];
  }

  if (Array.isArray(value)) {
    return value.flatMap((item) => extractAttributeComparableValues(item));
  }

  if (typeof value === "object") {
    const record = value as Record<string, unknown>;

    // commercetools enum / localized enum: { key, label }
    if ("key" in record || "label" in record) {
      const results: string[] = [];
      if (typeof record.key === "string" && record.key.trim()) {
        results.push(record.key.trim());
      }
      if ("label" in record) {
        results.push(...extractAttributeComparableValues(record.label));
      }
      return results;
    }

    // commercetools money: { centAmount, currencyCode }
    if (typeof record.centAmount === "number" && typeof record.currencyCode === "string") {
      return [
        String(record.centAmount),
        `${record.centAmount} ${record.currencyCode}`,
      ];
    }

    // commercetools reference: { typeId, id, key }
    if (typeof record.typeId === "string" && (typeof record.id === "string" || typeof record.key === "string")) {
      const refs: string[] = [];
      if (typeof record.id === "string") refs.push(record.id);
      if (typeof record.key === "string") refs.push(record.key);
      return refs;
    }

    // localized string object: { "en-AU": "...", "en-US": "..." }
    return Object.values(record).flatMap((entry) => extractAttributeComparableValues(entry));
  }

  return [];
}

function getNormalizedProductAttributes(product: LabelMatchableProduct): ProductAttributeEntry[] {
  const attributes = Array.isArray(product.attributes) ? [...product.attributes] : [];
  if (
    product.brand &&
    !attributes.some((attribute) => attribute.name.toLowerCase() === "brand")
  ) {
    attributes.push({ name: "brand", value: product.brand });
  }
  return attributes;
}

export function doesAttributeRuleMatch(
  rule: ProductLabelAttributeRule | undefined,
  product: LabelMatchableProduct,
): boolean {
  if (!rule) return false;
  const targetAttrName = rule.attributeName?.trim().toLowerCase();
  const targetRawValue = rule.value?.trim();
  if (!targetAttrName || !targetRawValue) return false;

  const operator: ProductLabelAttributeOperator = VALID_OPERATORS.has(rule.operator)
    ? rule.operator
    : "equals";

  const attributes = getNormalizedProductAttributes(product);
  const matchingAttributes = attributes.filter(
    (attribute) => attribute.name?.trim().toLowerCase() === targetAttrName,
  );

  if (matchingAttributes.length === 0) return false;

  const candidates = matchingAttributes
    .flatMap((attribute) => extractAttributeComparableValues(attribute.value))
    .map((entry) => entry.toLowerCase());

  if (candidates.length === 0) return false;

  if (operator === "in") {
    const allowedValues = targetRawValue
      .split(",")
      .map((part) => part.trim().toLowerCase())
      .filter(Boolean);
    return allowedValues.length > 0 && candidates.some((candidate) => allowedValues.includes(candidate));
  }

  const expected = targetRawValue.toLowerCase();
  if (operator === "contains") {
    return candidates.some((candidate) => candidate.includes(expected));
  }

  return candidates.some((candidate) => candidate === expected);
}

export function doesLabelMatchProduct(
  label: ProductLabelConfig,
  product: LabelMatchableProduct,
): boolean {
  const mode: ProductLabelTargetMode = VALID_TARGET_MODES.has(label.targetMode)
    ? label.targetMode
    : "products";

  const matchesProductId = Boolean(
    product.id && Array.isArray(label.productIds) && label.productIds.includes(product.id),
  );
  const matchesProductKey = Boolean(
    product.key && Array.isArray(label.productKeys) && label.productKeys.includes(product.key),
  );
  const matchesSpecificProduct = matchesProductId || matchesProductKey;
  const matchesAttribute = doesAttributeRuleMatch(label.attributeRule, product);

  if (mode === "products") {
    return matchesSpecificProduct;
  }

  if (mode === "attribute") {
    return matchesAttribute;
  }

  return matchesSpecificProduct || matchesAttribute;
}

export function resolveLabelsForProduct(
  labels: ProductLabelConfig[],
  product: LabelMatchableProduct,
  now: Date = new Date(),
): ProductLabelBadge[] {
  return labels
    .filter((label) => isLabelActive(label, now) && doesLabelMatchProduct(label, product))
    .sort((a, b) => {
      const priorityDiff = (b.priority ?? 0) - (a.priority ?? 0);
      if (priorityDiff !== 0) return priorityDiff;
      return a.text.localeCompare(b.text);
    })
    .map((label) => ({
      id: label.id,
      text: label.text.trim(),
      position: normalizeLabelPosition(label.position),
      customCss: label.customCss,
      priority: label.priority ?? 0,
    }));
}

function cssPropertyToCamelCase(property: string): string {
  if (property.startsWith("--")) {
    return property;
  }
  const normalized = property.toLowerCase();
  if (normalized.startsWith("-webkit-")) {
    return `Webkit${normalized.slice(8).replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase())}`;
  }
  if (normalized.startsWith("-moz-")) {
    return `Moz${normalized.slice(5).replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase())}`;
  }
  if (normalized.startsWith("-ms-")) {
    return `ms${normalized.slice(4).replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase())}`;
  }
  return normalized.replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase());
}

function stripOptionalBlockWrapper(css: string): string {
  const withoutComments = css.replace(/\/\*[\s\S]*?\*\//g, "").trim();
  if (!withoutComments) return "";

  const openBraceIndex = withoutComments.indexOf("{");
  const closeBraceIndex = withoutComments.lastIndexOf("}");
  if (openBraceIndex !== -1 && closeBraceIndex > openBraceIndex) {
    return withoutComments.slice(openBraceIndex + 1, closeBraceIndex).trim();
  }
  return withoutComments;
}

function splitCssDeclarations(input: string): string[] {
  const declarations: string[] = [];
  let current = "";
  let parenDepth = 0;
  let quote: '"' | "'" | null = null;

  for (let index = 0; index < input.length; index += 1) {
    const char = input[index];
    const previousChar = index > 0 ? input[index - 1] : "";

    if (quote) {
      current += char;
      if (char === quote && previousChar !== "\\") {
        quote = null;
      }
      continue;
    }

    if (char === '"' || char === "'") {
      quote = char;
      current += char;
      continue;
    }

    if (char === "(") {
      parenDepth += 1;
      current += char;
      continue;
    }

    if (char === ")" && parenDepth > 0) {
      parenDepth -= 1;
      current += char;
      continue;
    }

    if (char === ";" && parenDepth === 0) {
      if (current.trim()) {
        declarations.push(current.trim());
      }
      current = "";
      continue;
    }

    current += char;
  }

  if (current.trim()) {
    declarations.push(current.trim());
  }

  return declarations;
}

export function parseCustomCss(customCss?: string): Record<string, string> {
  if (!customCss || typeof customCss !== "string") return {};
  const body = stripOptionalBlockWrapper(customCss);
  if (!body) return {};

  const style: Record<string, string> = {};

  for (const declaration of splitCssDeclarations(body)) {
    const colonIndex = declaration.indexOf(":");
    if (colonIndex <= 0) continue;

    const rawProperty = declaration.slice(0, colonIndex).trim();
    const rawValue = declaration.slice(colonIndex + 1).trim();

    if (!rawProperty || !rawValue) continue;
    if (!SAFE_CSS_PROPERTY_REGEX.test(rawProperty)) continue;
    if (DISALLOWED_CSS_PROPERTIES.has(rawProperty.toLowerCase())) continue;
    if (DANGEROUS_CSS_VALUE_REGEX.test(rawValue)) continue;

    // Strip trailing !important since inline styles already take precedence and React rejects !important values
    const cleanedValue = rawValue.replace(/\s*!important\s*$/i, "").trim();
    if (!cleanedValue) continue;

    style[cssPropertyToCamelCase(rawProperty)] = cleanedValue;
  }

  return style;
}

export function normalizeCustomObjectToProductLabel(
  key: string,
  value: unknown,
  timestamps?: { createdAt?: string; lastModifiedAt?: string },
): ProductLabelConfig | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Record<string, unknown>;
  const text = typeof raw.text === "string" ? raw.text : "";
  const name = typeof raw.name === "string" && raw.name.trim() ? raw.name : text || key;

  const rawRule =
    raw.attributeRule && typeof raw.attributeRule === "object"
      ? (raw.attributeRule as Record<string, unknown>)
      : null;

  const attributeRule =
    rawRule && typeof rawRule.attributeName === "string"
      ? {
          attributeName: rawRule.attributeName,
          operator: VALID_OPERATORS.has(rawRule.operator as ProductLabelAttributeOperator)
            ? (rawRule.operator as ProductLabelAttributeOperator)
            : "equals",
          value: typeof rawRule.value === "string" ? rawRule.value : String(rawRule.value ?? ""),
          ...(typeof rawRule.attributeLabel === "string" ? { attributeLabel: rawRule.attributeLabel } : {}),
          ...(typeof rawRule.productTypeId === "string" ? { productTypeId: rawRule.productTypeId } : {}),
          ...(typeof rawRule.productTypeName === "string" ? { productTypeName: rawRule.productTypeName } : {}),
        }
      : undefined;

  const productIds = Array.isArray(raw.productIds)
    ? raw.productIds.filter((entry): entry is string => typeof entry === "string" && entry.trim().length > 0)
    : [];

  const productKeys = Array.isArray(raw.productKeys)
    ? raw.productKeys.filter((entry): entry is string => typeof entry === "string" && entry.trim().length > 0)
    : undefined;

  const products = Array.isArray(raw.products)
    ? raw.products.flatMap((entry) => {
        if (!entry || typeof entry !== "object") return [];
        const record = entry as Record<string, unknown>;
        if (typeof record.id !== "string") return [];
        return [
          {
            id: record.id,
            ...(typeof record.key === "string" ? { key: record.key } : {}),
            ...(typeof record.name === "string" ? { name: record.name } : {}),
          },
        ];
      })
    : undefined;

  const targetMode: ProductLabelTargetMode = VALID_TARGET_MODES.has(
    raw.targetMode as ProductLabelTargetMode,
  )
    ? (raw.targetMode as ProductLabelTargetMode)
    : attributeRule && productIds.length > 0
      ? "both"
      : attributeRule
        ? "attribute"
        : "products";

  return {
    id: typeof raw.id === "string" && raw.id.trim() ? raw.id : key,
    name,
    text,
    enabled: typeof raw.enabled === "boolean" ? raw.enabled : true,
    startDate: typeof raw.startDate === "string" ? raw.startDate : undefined,
    endDate: typeof raw.endDate === "string" ? raw.endDate : undefined,
    position: normalizeLabelPosition(raw.position),
    customCss: typeof raw.customCss === "string" ? raw.customCss : undefined,
    priority: typeof raw.priority === "number" && Number.isFinite(raw.priority) ? raw.priority : 0,
    targetMode,
    productIds,
    productKeys,
    products,
    attributeRule,
    createdAt: typeof raw.createdAt === "string" ? raw.createdAt : timestamps?.createdAt,
    updatedAt: typeof raw.updatedAt === "string" ? raw.updatedAt : timestamps?.lastModifiedAt,
  };
}

