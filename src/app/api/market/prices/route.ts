import { NextResponse } from "next/server";
import { getProductById } from "@/src/lib/commercetools/products";

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin || origin !== new URL(request.url).origin) {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  }

  const body = await request.json().catch(() => null) as { ids?: unknown } | null;
  if (!Array.isArray(body?.ids) || body.ids.length > 100 || body.ids.some((id) => typeof id !== "string")) {
    return NextResponse.json({ error: "Invalid product list." }, { status: 400 });
  }

  const prices = await Promise.all((body.ids as string[]).map(async (id) => {
    const product = await getProductById(id);
    return [id, product?.price ?? null] as const;
  }));
  return NextResponse.json({ prices: Object.fromEntries(prices) });
}
