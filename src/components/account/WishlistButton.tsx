"use client";
import { useActionState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { addToWishlistAction } from "@/src/lib/account/actions";
import { Button } from "@/src/components/ui/Button";

export function WishlistButton({ productId, variantId = 1 }: { productId: string; variantId?: number }) {
  const [state, action, pending] = useActionState(addToWishlistAction, {});
  const pathname = usePathname();
  return <form action={action} className="space-y-2">
    <input type="hidden" name="productId" value={productId} /><input type="hidden" name="variantId" value={variantId} /><input type="hidden" name="returnTo" value={pathname} />
    <Button type="submit" variant="secondary" size="sm" disabled={pending} className="w-full"><span aria-hidden="true" className="mr-2">♡</span>{pending ? "Saving…" : state.success ? "Saved to wishlist" : "Save to wishlist"}</Button>
    {state.error && <p role="alert" className="text-xs text-red-700">{state.error}</p>}
    {state.success && <p role="status" className="text-xs text-emerald-800">{state.success} <Link href="/account/wishlist" className="underline">View wishlist</Link></p>}
  </form>;
}
