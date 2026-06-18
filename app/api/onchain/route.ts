import { NextResponse } from "next/server";

import { getDexPairs } from "@/lib/cmc";
import { checkRateLimit, rateLimitHeaders, rateLimitPolicies } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const limit = await checkRateLimit(request, rateLimitPolicies.onchain);
  const headers = rateLimitHeaders(limit);

  if (!limit.ok) {
    return NextResponse.json(
      {
        error: "Too many on-chain monitor requests. Wait briefly and retry."
      },
      { status: 429, headers }
    );
  }

  const dex = await getDexPairs();

  return NextResponse.json(
    {
      generatedAt: new Date().toISOString(),
      endpoint: dex.endpointState,
      pairs: dex.ok ? dex.data : []
    },
    { status: dex.ok ? 200 : 502, headers }
  );
}
