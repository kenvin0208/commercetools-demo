"use client";

import { useRef } from "react";
import type { ProductCardItem } from "@/src/components/site/ProductCard";
import { ProductCard } from "@/src/components/site/ProductCard";

export function RelatedProductsSlider({ products }: { products: ProductCardItem[] }) {
  const sliderRef = useRef<HTMLDivElement>(null);

  if (products.length === 0) {
    return null;
  }

  function scroll(direction: -1 | 1) {
    const slider = sliderRef.current;
    slider?.scrollBy({ left: direction * slider.clientWidth * 0.8, behavior: "smooth" });
  }

  return (
    <section className="mt-16" aria-label="Related products">
      <div className="mb-6 flex items-center justify-between gap-4">
        <h2 className="text-2xl font-semibold text-slate-900">Related Product</h2>
        {products.length > 1 ? (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => scroll(-1)}
              aria-label="Previous related products"
              className="grid size-10 place-items-center rounded-full border border-slate-300 text-xl text-slate-800 transition hover:bg-slate-100"
            >
              &#8592;
            </button>
            <button
              type="button"
              onClick={() => scroll(1)}
              aria-label="Next related products"
              className="grid size-10 place-items-center rounded-full border border-slate-300 text-xl text-slate-800 transition hover:bg-slate-100"
            >
              &#8594;
            </button>
          </div>
        ) : null}
      </div>
      <div
        ref={sliderRef}
        className="flex snap-x snap-mandatory gap-6 overflow-x-auto scroll-smooth pb-3"
      >
        {products.map((product) => (
          <div key={product.id} className="w-[min(82vw,17rem)] shrink-0 snap-start sm:w-64">
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    </section>
  );
}
