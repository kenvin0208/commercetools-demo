import type { CSSProperties } from "react";
import {
  parseCustomCss,
  type ProductLabelBadge,
  type ProductLabelPosition,
} from "@/src/lib/product-labels";

const POSITION_CLASSES: Record<ProductLabelPosition, string> = {
  "top-left": "top-2.5 left-2.5 items-start",
  "top-right": "top-2.5 right-2.5 items-end",
  "bottom-left": "bottom-2.5 left-2.5 items-start",
  "bottom-right": "bottom-2.5 right-2.5 items-end",
};

const POSITIONS: ProductLabelPosition[] = [
  "top-left",
  "top-right",
  "bottom-left",
  "bottom-right",
];

export function ProductLabelsOverlay({ labels }: { labels?: ProductLabelBadge[] }) {
  if (!labels || labels.length === 0) {
    return null;
  }

  const grouped = new Map<ProductLabelPosition, ProductLabelBadge[]>();
  for (const position of POSITIONS) {
    grouped.set(position, []);
  }

  for (const label of labels) {
    const position = label.position in POSITION_CLASSES ? label.position : "top-left";
    grouped.get(position)?.push(label);
  }

  return (
    <>
      {POSITIONS.map((position) => {
        const cornerLabels = grouped.get(position);
        if (!cornerLabels || cornerLabels.length === 0) {
          return null;
        }

        return (
          <div
            key={position}
            data-label-position={position}
            className={`pointer-events-none absolute z-10 flex max-w-[calc(100%-1.25rem)] flex-col gap-1.5 ${POSITION_CLASSES[position]}`}
          >
            {cornerLabels.map((label) => {
              const customStyle = parseCustomCss(label.customCss) as CSSProperties;
              return (
                <span
                  key={label.id}
                  data-product-label-id={label.id}
                  style={customStyle}
                  className="inline-flex max-w-full items-center truncate rounded-md bg-slate-900/90 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-white shadow-sm backdrop-blur-sm"
                >
                  {label.text}
                </span>
              );
            })}
          </div>
        );
      })}
    </>
  );
}

