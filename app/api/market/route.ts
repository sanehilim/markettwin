import { NextResponse } from "next/server";

import { getFearGreedLatest, getGlobalMetrics, getLatestQuote, getTrendingTokens } from "@/lib/cmc";
import { checkRateLimit, rateLimitHeaders, rateLimitPolicies } from "@/lib/rate-limit";
import { sanitizeSymbol } from "@/lib/utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const limit = await checkRateLimit(request, rateLimitPolicies.market);
  const headers = rateLimitHeaders(limit);

  if (!limit.ok) {
    return NextResponse.json(
      {
        error: "Too many market feed requests. Wait briefly and retry."
      },
      { status: 429, headers }
    );
  }

  const { searchParams } = new URL(request.url);
  const symbol = sanitizeSymbol(searchParams.get("symbol") ?? "BTC") || "BTC";
  const [quote, global, fear, trending] = await Promise.all([
    getLatestQuote(symbol),
    getGlobalMetrics(),
    getFearGreedLatest(),
    getTrendingTokens()
  ]);

  const payload = {
    generatedAt: new Date().toISOString(),
    symbol,
    asset: quote.ok ? quote.data : null,
    global: global.ok ? global.data : null,
    fearGreed: fear.ok ? fear.data : null,
    trending: trending.ok ? trending.data : [],
    endpoints: [quote.endpointState, global.endpointState, fear.endpointState, trending.endpointState],
    error: quote.ok ? undefined : quote.issue.message
  };

  return NextResponse.json(payload, {
    status: quote.ok ? 200 : quote.issue.statusCode === 404 ? 404 : 502,
    headers
  });
}
