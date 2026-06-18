import { NextResponse } from "next/server";
import { z } from "zod";

import { buildMarketTwinReport } from "@/lib/market-twin";
import { explainReport } from "@/lib/openai";
import { checkRateLimit, rateLimitHeaders, rateLimitPolicies } from "@/lib/rate-limit";
import { getCachedValue, setCachedValue } from "@/lib/server-cache";
import type { MarketTwinReport } from "@/lib/types";
import { sanitizeSymbol } from "@/lib/utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  symbol: z.string().min(1).max(12).default("BTC")
});

const ANALYSIS_CACHE_MS = 60_000;

export async function POST(request: Request) {
  const limit = await checkRateLimit(request, rateLimitPolicies.analyze);
  const headers = rateLimitHeaders(limit);

  if (!limit.ok) {
    return NextResponse.json(
      {
        error: "Too many analysis requests. Wait briefly before running another market twin."
      },
      { status: 429, headers }
    );
  }

  const body = await request.json().catch(() => ({}));
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Symbol could not be analyzed. Use a tracked CMC symbol such as BTC, ETH, SOL, or BNB."
      },
      { status: 400, headers }
    );
  }

  const symbol = sanitizeSymbol(parsed.data.symbol);
  if (!symbol) {
    return NextResponse.json(
      {
        error: "Symbol could not be analyzed. Use letters and numbers only."
      },
      { status: 400, headers }
    );
  }

  const cacheKey = `markettwin:analysis:${symbol}`;
  const cached = await getCachedValue<MarketTwinReport>(cacheKey);
  if (cached) {
    return NextResponse.json(cached, { headers });
  }

  const reportWithoutExplanation = await buildMarketTwinReport(symbol);
  const quoteIssue = reportWithoutExplanation.dataCoverage.issues.find(
    (issue) => issue.endpoint === "/v3/cryptocurrency/quotes/latest"
  );

  if (!reportWithoutExplanation.asset) {
    return NextResponse.json(
      {
        error: quoteIssue?.message ?? `MarketTwin could not load a live quote for ${symbol}.`,
        dataCoverage: reportWithoutExplanation.dataCoverage
      },
      { status: quoteIssue?.statusCode === 404 ? 404 : 502, headers }
    );
  }

  const explanation = await explainReport(reportWithoutExplanation);
  const report = {
    ...reportWithoutExplanation,
    explanation
  };
  await setCachedValue(cacheKey, report, ANALYSIS_CACHE_MS);

  return NextResponse.json(report, { headers });
}
