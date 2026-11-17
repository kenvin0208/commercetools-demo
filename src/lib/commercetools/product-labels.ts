import { cache } from "react";
import { apiRoot, hasCtpCredentials } from "@/src/lib/commercetools/client";
import {
  PRODUCT_LABELS_CONTAINER,
  normalizeCustomObjectToProductLabel,
  type ProductLabelConfig,
} from "@/src/lib/product-labels";

export const getProductLabels = cache(async (): Promise<ProductLabelConfig[]> => {
  if (!hasCtpCredentials || !apiRoot) {
    return [];
  }

  try {
    const labels: ProductLabelConfig[] = [];
    let offset = 0;

    while (true) {
      const response = await apiRoot
        .customObjects()
        .withContainer({ container: PRODUCT_LABELS_CONTAINER })
        .get({
          queryArgs: {
            limit: 500,
            offset,
            withTotal: false,
            sort: "lastModifiedAt desc",
          },
        })
        .execute();

      const results = response.body.results ?? [];
      for (const item of results) {
        const normalized = normalizeCustomObjectToProductLabel(item.key, item.value, {
          createdAt: item.createdAt,
          lastModifiedAt: item.lastModifiedAt,
        });
        if (normalized) {
          labels.push(normalized);
        }
      }

      if (results.length < 500) {
        break;
      }
      offset += results.length;
    }

    return labels;
  } catch (error) {
    console.error("Failed to load product labels from commercetools", error);
    return [];
  }
});

