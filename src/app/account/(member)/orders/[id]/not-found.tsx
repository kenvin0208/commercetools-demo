import Link from "next/link";
export default function OrderNotFound() {
  return <div className="py-12 text-center"><h2 className="text-2xl font-bold">Order not found</h2><p className="mt-3 text-slate-500">This order is unavailable for your account.</p><Link href="/account/orders" className="mt-6 inline-block font-semibold underline">Back to my orders</Link></div>;
}
