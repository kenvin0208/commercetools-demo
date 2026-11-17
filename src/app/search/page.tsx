import { searchProducts } from "@/src/lib/commercetools/products";
import { SearchResults } from "@/src/components/site/SearchResults";
import { Button } from "@/src/components/ui/Button";
import { Input } from "@/src/components/ui/Input";

export default async function SearchPage({
  searchParams,
}: {
  searchParams?: Promise<{ q?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const query = params.q ?? "";
  const data = await searchProducts({ query, limit: 8 });

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-black text-slate-900">Search</h1>
        <form method="get" action="/search" className="mt-6 flex gap-3">
          <Input
            name="q"
            defaultValue={query}
            placeholder="Search by product name"
            className="flex-1 rounded-full"
          />
          <Button type="submit" className="px-6">
            Search
          </Button>
        </form>
      </div>

      <SearchResults products={data.results} query={query} total={data.total} />
    </div>
  );
}
