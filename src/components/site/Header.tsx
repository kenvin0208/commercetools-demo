"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useCart } from "@/src/components/site/CartProvider";
import { Input } from "@/src/components/ui/Input";
import { formatPrice } from "@/src/utils/price";
import { useMarket } from "@/src/components/site/MarketProvider";

type ProductSuggestion = {
  id: string;
  name: string;
  slug: string;
  image?: string;
  price?: {
    centAmount: number;
    currencyCode: string;
  };
};

type SearchSuggestions = {
  products: ProductSuggestion[];
  categories: { id: string; name: string }[];
  brands: { name: string }[];
  total: number;
};

export function SiteHeader() {
  const { totalItems } = useCart();
  const { market, switchMarket } = useMarket();
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<SearchSuggestions>({ products: [], categories: [], brands: [], total: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    if (!isMenuOpen) return;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsMenuOpen(false);
    };

    document.addEventListener("keydown", closeOnEscape);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", closeOnEscape);
      document.body.style.overflow = previousOverflow;
    };
  }, [isMenuOpen]);

  useEffect(() => {
    const normalizedQuery = query.trim();

    if (normalizedQuery.length === 0) return;

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setIsLoading(true);

      try {
        const response = await fetch(`/api/search/suggestions?q=${encodeURIComponent(normalizedQuery)}`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("Unable to load search suggestions");
        }

        const payload = (await response.json()) as Partial<SearchSuggestions>;
        setSuggestions({
          products: payload.products ?? [],
          categories: payload.categories ?? [],
          brands: payload.brands ?? [],
          total: payload.total ?? 0,
        });
        setIsOpen(true);
      } catch {
        if (controller.signal.aborted) {
          return;
        }

        setSuggestions({ products: [], categories: [], brands: [], total: 0 });
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }, 180);

    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [query]);

  const handleSearchChange = (value: string) => {
    setQuery(value);

    if (value.trim().length === 0) {
      setSuggestions({ products: [], categories: [], brands: [], total: 0 });
      setIsLoading(false);
      setIsOpen(false);
    }
  };

  return (
    <header className="border-b bg-white/90 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8">
          <button
            type="button"
            className="inline-flex size-10 items-center justify-center rounded-full border border-slate-200 text-slate-900 transition hover:bg-slate-50 md:hidden"
            aria-label="Open navigation menu"
            aria-expanded={isMenuOpen}
            aria-controls="mobile-navigation"
            onClick={() => setIsMenuOpen(true)}
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </button>
          <Link href="/" className="text-2xl font-black tracking-tight text-slate-900">
            NamNX
          </Link>

          <nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 md:flex">
            <Link href="/">Home</Link>
            <Link href="/products">Shop</Link>
            <Link href="/stores">Stores</Link>
            <Link href="/search">Search</Link>
            <Link href="/account">Account</Link>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <label className="sr-only" htmlFor="market-switcher">Market</label>
          <select
            id="market-switcher"
            value={market}
            onChange={(event) => void switchMarket(event.target.value as "AU" | "US")}
            className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700"
            aria-label="Select market and currency"
          >
            <option value="AU">Australia · AUD</option>
            <option value="US">United States · USD</option>
          </select>
          <div className="relative hidden md:block">
            <form action="/search" method="get" className="flex items-center rounded-full border bg-slate-50 px-3 py-2">
              <Input
                type="search"
                name="q"
                value={query}
                autoComplete="off"
                placeholder="Search products"
                aria-autocomplete="list"
                aria-controls="search-suggestions"
                aria-expanded={isOpen && query.trim().length > 0}
                onChange={(event) => handleSearchChange(event.target.value)}
                onFocus={() => {
                  if (suggestions.products.length > 0 || suggestions.categories.length > 0 || suggestions.brands.length > 0) setIsOpen(true);
                }}
                onBlur={() => window.setTimeout(() => setIsOpen(false), 150)}
                className="w-44 border-0 bg-transparent px-0 py-0 focus:ring-0"
              />
            </form>

            {isOpen && query.trim().length > 0 ? (
              <div
                id="search-suggestions"
                role="listbox"
                className="absolute right-0 z-50 mt-2 w-[46rem] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl"
              >
                {isLoading ? <p className="px-5 py-4 text-sm text-slate-500">Searching…</p> : null}
                {!isLoading ? (
                  <div className="grid grid-cols-[1.15fr_0.85fr] divide-x divide-slate-100">
                    <section className="p-4">
                      <p className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Products</p>
                      {suggestions.products.length > 0 ? (
                        <div className="space-y-1">
                          {suggestions.products.map((product) => (
                            <Link
                              key={product.id}
                              href={`/products/${encodeURIComponent(product.slug)}`}
                              role="option"
                              className="flex items-center gap-3 rounded-xl p-2 transition hover:bg-slate-50"
                              onClick={() => setIsOpen(false)}
                            >
                              <div className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                                {product.image ? <Image src={product.image} alt="" fill sizes="48px" className="object-cover" /> : null}
                              </div>
                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-slate-900">{product.name}</p>
                                {product.price ? <p className="mt-0.5 text-xs text-slate-500">{formatPrice(product.price.centAmount, product.price.currencyCode)}</p> : null}
                              </div>
                            </Link>
                          ))}
                        </div>
                      ) : (
                        <p className="py-2 text-sm text-slate-500">No matching products.</p>
                      )}
                    </section>

                    <aside className="divide-y divide-slate-100">
                      <section className="p-4">
                        <p className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Categories</p>
                        {suggestions.categories.length > 0 ? (
                          <div className="space-y-1">
                            {suggestions.categories.map((category) => (
                              <Link key={category.id} href={`/products?category=${encodeURIComponent(category.id)}`} className="block rounded-lg px-2 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 hover:text-slate-950" onClick={() => setIsOpen(false)}>
                                {category.name}
                              </Link>
                            ))}
                          </div>
                        ) : <p className="text-sm text-slate-500">No categories found.</p>}
                      </section>
                      <section className="p-4">
                        <p className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Brands</p>
                        {suggestions.brands.length > 0 ? (
                          <div className="space-y-1">
                            {suggestions.brands.map((brand) => (
                              <Link key={brand.name} href={`/search?q=${encodeURIComponent(brand.name)}`} className="block rounded-lg px-2 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 hover:text-slate-950" onClick={() => setIsOpen(false)}>
                                {brand.name}
                              </Link>
                            ))}
                          </div>
                        ) : <p className="text-sm text-slate-500">No brands found.</p>}
                      </section>
                    </aside>
                  </div>
                ) : null}
                {!isLoading ? (
                  <Link href={`/search?q=${encodeURIComponent(query.trim())}`} className="flex items-center justify-between border-t border-slate-100 px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-50" onClick={() => setIsOpen(false)}>
                    <span>View all products</span>
                    <span className="text-slate-500">{suggestions.total} results</span>
                  </Link>
                ) : null}
              </div>
            ) : null}
          </div>

          <Link href="/cart" className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-900 px-4 py-2 text-sm font-medium text-white">
            Cart
            {totalItems > 0 ? <span className="rounded-full bg-white/15 px-2 py-0.5 text-xs">{totalItems}</span> : null}
          </Link>
        </div>
      </div>

      <button
        type="button"
        aria-label="Close navigation menu"
        tabIndex={isMenuOpen ? 0 : -1}
        onClick={() => setIsMenuOpen(false)}
        className={`fixed inset-0 z-50 bg-slate-950/35 transition-opacity md:hidden ${isMenuOpen ? "opacity-100" : "pointer-events-none opacity-0"}`}
      />
      <aside
        id="mobile-navigation"
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        aria-hidden={!isMenuOpen}
        className={`fixed h-dvh inset-y-0 left-0 z-[60] flex w-[min(22rem,calc(100vw-3rem))] flex-col bg-white shadow-2xl transition-transform duration-300 ease-out md:hidden ${isMenuOpen ? "translate-x-0" : "pointer-events-none -translate-x-full"}`}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-5">
          <Link href="/" className="text-2xl font-black tracking-tight text-slate-900" tabIndex={isMenuOpen ? 0 : -1} onClick={() => setIsMenuOpen(false)}>
            NamNX
          </Link>
          <button
            type="button"
            className="inline-flex size-10 items-center justify-center rounded-full border border-slate-200 text-slate-900 transition hover:bg-slate-50"
            aria-label="Close navigation menu"
            tabIndex={isMenuOpen ? 0 : -1}
            onClick={() => setIsMenuOpen(false)}
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </div>
        <nav className="flex flex-col px-5 py-4 text-base font-semibold text-slate-800">
          {[
            { href: "/", label: "Home" },
            { href: "/products", label: "Shop" },
            { href: "/stores", label: "Stores" },
            { href: "/search", label: "Search" },
            { href: "/account", label: "Account" },
          ].map((item) => (
            <Link key={item.href} href={item.href} tabIndex={isMenuOpen ? 0 : -1} onClick={() => setIsMenuOpen(false)} className="border-b border-slate-100 px-2 py-4 transition hover:text-slate-500">
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
    </header>
  );
}
