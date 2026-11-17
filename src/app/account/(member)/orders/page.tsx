import Link from "next/link";
import { customerOrders } from "@/src/lib/account/queries";
import { OrderStatus, orderDate, orderMoney } from "@/src/components/account/OrderDisplay";

export default async function OrdersPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const params = await searchParams;
  const parsed = Number(params.page ?? 1);
  const page = Number.isSafeInteger(parsed) && parsed >= 1 ? Math.min(parsed, 1001) : 1;
  const orders = await customerOrders(page);
  return <><h2 className="text-2xl font-bold">My orders</h2><p className="mb-8 mt-2 text-sm text-slate-500">Your purchases and their latest delivery updates.</p>
    {orders.results.length === 0 ? <div className="rounded-2xl bg-slate-50 px-5 py-16 text-center"><h3 className="text-lg font-semibold">{page === 1 ? "No orders yet" : "No orders on this page"}</h3><p className="mt-2 text-sm text-slate-500">Orders placed with your account will appear here.</p><Link href={page === 1 ? "/products" : "/account/orders"} className="mt-6 inline-block text-sm font-semibold underline underline-offset-4">{page === 1 ? "Start shopping" : "Back to orders"}</Link></div> : <div className="space-y-4">{orders.results.map(order => <Link key={order.id} href={`/account/orders/${order.id}`} className="block rounded-2xl border border-slate-200 p-5 transition hover:border-slate-400">
      <div className="flex flex-wrap items-start justify-between gap-4"><div><h3 className="font-semibold">Order #{order.orderNumber ?? order.id.slice(0, 8)}</h3><p className="mt-1 text-sm text-slate-500">{orderDate(order.createdAt)} · {order.lineItems.reduce((sum, item) => sum + item.quantity, 0) + order.customLineItems.reduce((sum, item) => sum + item.quantity, 0)} items</p></div><p className="font-bold">{orderMoney(order.totalPrice)}</p></div>
      <div className="mt-5 flex flex-wrap items-center gap-3"><OrderStatus value={order.orderState} /><span className="text-xs text-slate-500">Payment</span><OrderStatus value={order.paymentState} /><span className="text-xs text-slate-500">Shipping</span><OrderStatus value={order.shipmentState} /><span className="ml-auto text-sm font-semibold">View details →</span></div>
    </Link>)}</div>}
    <nav aria-label="Order pages" className="mt-8 flex items-center justify-between text-sm">{page > 1 ? <Link href={`/account/orders?page=${page - 1}`} className="font-semibold underline">← Previous</Link> : <span />}<span className="text-slate-500">Page {page}</span>{page < 1001 && orders.offset + orders.count < (orders.total ?? 0) ? <Link href={`/account/orders?page=${page + 1}`} className="font-semibold underline">Next →</Link> : <span />}</nav>
  </>;
}
