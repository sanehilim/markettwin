import { NextResponse } from "next/server";

import { adminRequiredMessage, isAdminRequest } from "@/lib/admin";
import { hasCmcKey, hasOpenAiKey } from "@/lib/config";
import { getFearGreedLatest, getGlobalMetrics, getKeyInfo, getLatestQuote } from "@/lib/cmc";
import { checkOpenAiHealth } from "@/lib/openai";
import { checkRateLimit, rateLimitHeaders, rateLimitPolicies } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const limit = await checkRateLimit(request, rateLimitPolicies.health);
  const headers = rateLimitHeaders(limit);

  if (!limit.ok) {
    return NextResponse.json(
      {
        error: "Too many health checks. Wait briefly and retry."
      },
      { status: 429, headers }
    );
  }

  if (!isAdminRequest(request)) {
    return NextResponse.json(
      {
        error: adminRequiredMessage()
      },
      { status: 401, headers }
    );
  }

  const [keyInfo, quote, global, fear, openai] = await Promise.all([
    getKeyInfo(),
    getLatestQuote("BTC"),
    getGlobalMetrics(),
    getFearGreedLatest(),
    checkOpenAiHealth()
  ]);

  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    secrets: {
      coinmarketcap: hasCmcKey(),
      openai: hasOpenAiKey()
    },
    endpoints: [keyInfo.endpointState, quote.endpointState, global.endpointState, fear.endpointState],
    openai
  }, { headers });
}
