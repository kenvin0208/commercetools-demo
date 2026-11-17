import Link from "next/link";
import Image from "next/image";
import { customerWishlist } from "@/src/lib/account/queries";
import { updateWishlistAction } from "@/src/lib/account/actions";
import { AccountForm } from "@/src/components/account/AccountForm";
import { Field } from "@/src/components/account/Fields";
import { Button } from "@/src/components/ui/Button";
import { getLocalizedValue } from "@/src/utils/localized";

export default async function WishlistPage() {
  const list = await customerWishlist();
  return <><div className="flex flex-wrap items-start justify-between gap-4"><div><h2 className="text-2xl font-bold">My wishlist</h2><p className="mt-2 text-sm text-slate-500">A place for everything you have your eye on.</p></div><Link href="/products" className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold">Discover products</Link></div>
    {!list?.lineItems.length ? <div className="py-20 text-center"><p aria-hidden="true" className="text-5xl text-slate-300">♡</p><h3 className="mt-5 text-xl font-semibold">Your wishlist is waiting</h3><p className="mt-2 text-sm text-slate-500">Save products while you shop and find them here.</p><Link href="/products" className="mt-6 inline-block rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white">Explore the collection</Link></div> : <div className="mt-8 divide-y divide-slate-100">{list.lineItems.map(item => {
      const name = getLocalizedValue(item.name);
      const image = item.variant?.images?.[0]?.url;
      return <article key={item.id} className="flex flex-col gap-5 py-6 sm:flex-row">
        <div className="relative h-36 w-28 shrink-0 overflow-hidden rounded-xl bg-slate-100">{image && <Image src={image} alt={name} fill sizes="112px" className="object-cover" />}</div>
        <div className="min-w-0 flex-1"><h3 className="font-semibold">{name}</h3><p className="mt-1 text-xs text-slate-500">{item.variant?.sku ? `SKU: ${item.variant.sku}` : `Variant ${item.variantId ?? 1}`}</p>
          {item.variant ? <Link href={`/products/${encodeURIComponent(item.productId)}`} className="mt-3 inline-block text-sm font-semibold underline underline-offset-4">View product</Link> : <p className="mt-3 text-sm text-amber-700">This product is currently unavailable.</p>}
          <AccountForm action={updateWishlistAction} className="mt-4 space-y-3"><input type="hidden" name="listId" value={list.id} /><input type="hidden" name="version" value={list.version} /><input type="hidden" name="lineItemId" value={item.id} />
            <div className="flex flex-wrap items-end gap-3"><div className="w-24"><Field label="Quantity" name="quantity" type="number" min={1} max={999} defaultValue={item.quantity} required /></div><Button type="submit" name="operation" value="quantity" variant="secondary" size="sm">Update</Button><Button type="submit" name="operation" value="remove" variant="danger" size="sm" formNoValidate>Remove</Button></div>
          </AccountForm>
        </div>
      </article>;
    })}</div>}
  </>;
}
