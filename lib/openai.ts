import "server-only";

import OpenAI from "openai";

import { appConfig, hasOpenAiKey } from "@/lib/config";
import { logProviderIssue, openAiPublicMessage } from "@/lib/provider-errors";
import type { MarketTwinReport } from "@/lib/types";
import { dateOnly, formatPercent } from "@/lib/utils";

const OPENAI_TIMEOUT_MS = 12_000;
const OPENAI_HEALTH_CACHE_MS = 60_000;

let openAiHealthCache:
  | {
      expiresAt: number;
      result: Awaited<ReturnType<typeof uncachedOpenAiHealth>>;
    }
  | null = null;

export async function checkOpenAiHealth() {
  const now = Date.now();
  if (openAiHealthCache && openAiHealthCache.expiresAt > now) return openAiHealthCache.result;

  const result = await uncachedOpenAiHealth();
  openAiHealthCache = {
    expiresAt: now + OPENAI_HEALTH_CACHE_MS,
    result
  };
  return result;
}

async function uncachedOpenAiHealth() {
  if (!hasOpenAiKey()) {
    return {
      ok: false,
      label: "OpenAI Responses API",
      message: "OPENAI_API_KEY is missing."
    };
  }

  try {
    const client = createOpenAiClient();
    const response = await client.responses.create(
      {
        model: appConfig.openaiModel,
        max_output_tokens: 16,
        instructions: "Return the single word ok.",
        input: "Health check."
      },
      { timeout: OPENAI_TIMEOUT_MS }
    );

    const output = response.output_text?.trim();

    return {
      ok: Boolean(output),
      label: "OpenAI Responses API",
      message: output
        ? `Model ${appConfig.openaiModel} responded successfully.`
        : `Model ${appConfig.openaiModel} returned an empty health response.`
    };
  } catch (error) {
    logProviderIssue("openai", {
      scope: "health",
      errorMessage: error instanceof Error ? error.message : "unknown error"
    });
    return {
      ok: false,
      label: "OpenAI Responses API",
      message: openAiPublicMessage()
    };
  }
}

export async function explainReport(report: Omit<MarketTwinReport, "explanation">) {
  if (!hasOpenAiKey()) return deterministicExplanation(report);

  try {
    const client = createOpenAiClient();
    const response = await client.responses.create(
      {
        model: appConfig.openaiModel,
        max_output_tokens: 550,
        instructions:
          "You explain crypto market analog reports for research review only. Use only the supplied data. Do not give financial advice, trade ideas, strategies, entries, exits, buy/sell language, leverage language, allocation language, or certainty. Do not invent metrics or dates. Keep the answer under 160 words with a calm quant-research tone.",
        input: JSON.stringify({
          symbol: report.symbol,
          generatedAt: report.generatedAt,
          asset: report.asset,
          currentFeatures: report.features,
          twins: report.twins.slice(0, 4),
          prediction: report.prediction,
          dataIssues: report.dataCoverage.issues
        })
      },
      { timeout: OPENAI_TIMEOUT_MS }
    );

    return researchOnlyExplanation(response.output_text?.trim(), report);
  } catch (error) {
    logProviderIssue("openai", {
      scope: "explanation",
      errorMessage: error instanceof Error ? error.message : "unknown error"
    });
    return deterministicExplanation(report);
  }
}

function researchOnlyExplanation(output: string | undefined, report: Omit<MarketTwinReport, "explanation">) {
  if (!output) return deterministicExplanation(report);
  if (
    /\b(buy|sell|leverage|leveraged|allocation|allocate|entry|exit|stop-loss|take-profit|strategy|strategies)\b/i.test(
      output
    )
  ) {
    return deterministicExplanation(report);
  }
  return output;
}

function createOpenAiClient() {
  return new OpenAI({
    apiKey: appConfig.openaiApiKey,
    timeout: OPENAI_TIMEOUT_MS,
    maxRetries: 1
  });
}

function deterministicExplanation(report: Omit<MarketTwinReport, "explanation">) {
  if (report.twins.length === 0) {
    const firstIssue = report.dataCoverage.issues[0]?.message;
    return firstIssue
      ? `MarketTwin could not run the analog engine yet: ${firstIssue}`
      : "MarketTwin needs more historical observations before it can compare today’s market state with prior regimes.";
  }

  const best = report.twins[0];
  const avg = report.prediction.averageReturn14d;
  return `${report.symbol} currently maps closest to ${dateOnly(best.date)} with ${best.similarity.toFixed(
    1
  )}% similarity. The nearest historical states averaged ${formatPercent(
    avg
  )} over the next 14 days, with ${report.prediction.riskLevel.toLowerCase()} risk and ${report.prediction.confidence.toLowerCase()} confidence. The main match drivers are RSI, momentum, volume ratio, sentiment, and market dominance. This is historical context, not a trade recommendation.`;
}
