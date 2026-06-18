import "server-only";

import {
  getFearGreedHistorical,
  getFearGreedLatest,
  getGlobalMetrics,
  getHistoricalQuotes,
  getLatestQuote
} from "@/lib/cmc";
import {
  computeFeatures,
  cosineSimilarity,
  featureVector,
  inferRegime,
  maxDrawdown,
  percentageChange
} from "@/lib/indicators";
import type {
  ApiIssue,
  EndpointState,
  FearGreedPoint,
  HistoricalPoint,
  HistoricalTwin,
  MarketFeatures,
  MarketTwinReport,
  PredictionSummary
} from "@/lib/types";
import { mean, sanitizeSymbol } from "@/lib/utils";

const MIN_ANALOG_POINTS = 75;

export async function buildMarketTwinReport(symbolInput: string): Promise<Omit<MarketTwinReport, "explanation">> {
  const symbol = sanitizeSymbol(symbolInput || "BTC") || "BTC";
  const [quote, historical, global, fearLatest, fearHistory] = await Promise.all([
    getLatestQuote(symbol),
    getHistoricalQuotes(symbol),
    getGlobalMetrics(),
    getFearGreedLatest(),
    getFearGreedHistorical()
  ]);

  const endpoints: EndpointState[] = [
    quote.endpointState,
    historical.endpointState,
    global.endpointState,
    fearLatest.endpointState,
    fearHistory.endpointState
  ];
  const issues = endpoints.flatMap((endpoint) => (endpoint.ok ? [] : [endpoint.issue]));
  const history = historical.ok ? historical.data : [];
  const asset = quote.ok ? quote.data : null;
  const globalData = global.ok ? global.data : null;
  const fear = fearLatest.ok ? fearLatest.data : null;
  const fearSeries = fearHistory.ok ? fearHistory.data : [];

  const augmentedHistory = mergeLatestPoint(history, asset);
  const features = computeFeatures(augmentedHistory, {
    fearGreed: fear?.value ?? null,
    btcDominance: globalData?.btcDominance ?? null,
    marketCapChange24h: globalData?.marketCapChange24h ?? asset?.percentChange24h ?? null
  });

  const comparisonFeatures = comparableTwinFeatures(features);
  const twins =
    augmentedHistory.length >= MIN_ANALOG_POINTS
      ? findHistoricalTwins(augmentedHistory, comparisonFeatures, fearSeries)
      : [];
  const prediction = summarizePrediction(twins);

  if (augmentedHistory.length < MIN_ANALOG_POINTS) {
    issues.push({
      endpoint: "/v3/cryptocurrency/quotes/historical",
      message:
        "Historical price coverage is too small for analog search. Upgrade the CMC plan or reduce the requested horizon.",
      recoverable: true
    });
  }

  return {
    symbol,
    generatedAt: new Date().toISOString(),
    asset,
    global: globalData,
    fearGreed: fear,
    features,
    twins,
    prediction,
    dataCoverage: {
      historicalPoints: augmentedHistory.length,
      fearGreedPoints: fearSeries.length,
      endpoints,
      issues: dedupeIssues(issues)
    }
  };
}

function findHistoricalTwins(
  history: HistoricalPoint[],
  currentFeatures: MarketFeatures,
  fearHistory: FearGreedPoint[]
): HistoricalTwin[] {
  const currentVector = featureVector(currentFeatures);
  const candidates: HistoricalTwin[] = [];

  for (let index = 35; index < history.length - 31; index += 1) {
    const historyToDate = history.slice(0, index + 1);
    const fearAtDate = nearestFearValue(fearHistory, history[index].timestamp);
    const features = computeFeatures(historyToDate, {
      fearGreed: fearAtDate,
      btcDominance: null,
      marketCapChange24h: null
    });
    const vector = featureVector(features);
    const similarity = cosineSimilarity(currentVector, vector);
    const price = history[index].price;
    const returns = {
      oneDay: percentageChange(price, history[index + 1]?.price),
      sevenDay: percentageChange(price, history[index + 7]?.price),
      fourteenDay: percentageChange(price, history[index + 14]?.price),
      thirtyDay: percentageChange(price, history[index + 30]?.price)
    };

    candidates.push({
      date: history[index].timestamp,
      similarity: similarity * 100,
      features,
      returns,
      maxDrawdown14d: maxDrawdown(history, index, 14),
      regime: inferRegime(features)
    });
  }

  return candidates
    .filter((candidate) => Number.isFinite(candidate.similarity))
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, 6);
}

function comparableTwinFeatures(features: MarketFeatures): MarketFeatures {
  return {
    ...features,
    btcDominance: null,
    marketCapChange24h: null
  };
}

function summarizePrediction(twins: HistoricalTwin[]): PredictionSummary {
  if (twins.length === 0) {
    return {
      bullishProbability: null,
      bearishProbability: null,
      averageReturn14d: null,
      averageReturn30d: null,
      averageDrawdown14d: null,
      riskLevel: "Insufficient data",
      confidence: "Insufficient data"
    };
  }

  const fourteenDay = twins
    .map((twin) => twin.returns.fourteenDay)
    .filter((value): value is number => Number.isFinite(value ?? NaN));
  const thirtyDay = twins
    .map((twin) => twin.returns.thirtyDay)
    .filter((value): value is number => Number.isFinite(value ?? NaN));
  const drawdowns = twins
    .map((twin) => twin.maxDrawdown14d)
    .filter((value): value is number => Number.isFinite(value ?? NaN));
  const bullishProbability =
    fourteenDay.length > 0 ? (fourteenDay.filter((value) => value > 0).length / fourteenDay.length) * 100 : null;
  const averageDrawdown14d = mean(drawdowns);
  const averageSimilarity = mean(twins.map((twin) => twin.similarity)) ?? 0;
  const averageReturn14d = mean(fourteenDay);
  const averageReturn30d = mean(thirtyDay);

  return {
    bullishProbability,
    bearishProbability: bullishProbability === null ? null : 100 - bullishProbability,
    averageReturn14d,
    averageReturn30d,
    averageDrawdown14d,
    riskLevel: riskLevel(averageDrawdown14d, averageReturn14d),
    confidence: confidenceLevel(averageSimilarity, fourteenDay.length)
  };
}

function riskLevel(drawdown: number | null, avgReturn: number | null): PredictionSummary["riskLevel"] {
  if (drawdown === null || avgReturn === null) return "Insufficient data";
  if (drawdown < -12 || avgReturn < -4) return "High";
  if (drawdown < -6 || avgReturn < 2) return "Medium";
  return "Low";
}

function confidenceLevel(similarity: number, sampleSize: number): PredictionSummary["confidence"] {
  if (sampleSize < 3) return "Insufficient data";
  if (similarity >= 88 && sampleSize >= 5) return "High";
  if (similarity >= 76) return "Medium";
  return "Low";
}

function nearestFearValue(series: FearGreedPoint[], timestamp: string) {
  if (series.length === 0) return null;
  const target = new Date(timestamp).getTime();
  let best: FearGreedPoint | null = null;
  let bestDistance = Number.POSITIVE_INFINITY;
  for (const point of series) {
    const distance = Math.abs(new Date(point.timestamp).getTime() - target);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = point;
    }
  }
  return best?.value ?? null;
}

function mergeLatestPoint(history: HistoricalPoint[], asset: { price: number; volume24h?: number; marketCap?: number } | null) {
  if (!asset?.price) return history;
  const today = new Date().toISOString();
  const last = history.at(-1);
  if (last && Math.abs(new Date(today).getTime() - new Date(last.timestamp).getTime()) < 12 * 60 * 60 * 1000) {
    return [
      ...history.slice(0, -1),
      {
        timestamp: today,
        price: asset.price,
        volume24h: asset.volume24h,
        marketCap: asset.marketCap
      }
    ];
  }
  return [
    ...history,
    {
      timestamp: today,
      price: asset.price,
      volume24h: asset.volume24h,
      marketCap: asset.marketCap
    }
  ];
}

function dedupeIssues(issues: ApiIssue[]) {
  const seen = new Set<string>();
  return issues.filter((issue) => {
    const key = `${issue.endpoint}:${issue.message}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
