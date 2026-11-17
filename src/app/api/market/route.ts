import { NextResponse } from "next/server";
import { isMarketCode } from "@/src/lib/market";
import { MARKET_COOKIE } from "@/src/lib/market-server";

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin || origin !== new URL(request.url).origin) {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  }

  const body = await request.json().catch(() => null) as { market?: unknown } | null;
  if (!isMarketCode(body?.market)) {
    return NextResponse.json({ error: "Unsupported market." }, { status: 400 });
  }

  const response = NextResponse.json({ market: body.market });
  response.cookies.set(MARKET_COOKIE, body.market, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  return response;
}
