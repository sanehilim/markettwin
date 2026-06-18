import type { HistoricalPoint, MarketFeatures } from "@/lib/types";
import { clamp, standardDeviation } from "@/lib/utils";

export function computeFeatures(
  history: HistoricalPoint[],
  context: {
    fearGreed?: number | null;
    btcDominance?: number | null;
    marketCapChange24h?: number | null;
  } = {}
): MarketFeatures {
  const prices = history.map((point) => point.price).filter((price) => Number.isFinite(price) && price > 0);
  const volumes = history.map((point) => point.volume24h ?? null);
  const returns = percentageReturns(prices);
  const latest = prices.at(-1);

  return {
    rsi14: prices.length >= 15 ? rsi(prices, 14) : null,
    ema50: prices.length >= 50 ? ema(prices, 50).at(-1) ?? null : null,
    ema200: prices.length >= 200 ? ema(prices, 200).at(-1) ?? null : null,
    macd: prices.length >= 35 ? macdHistogram(prices) : null,
    volatility30d:
      returns.length >= 30 ? (standardDeviation(returns.slice(-30)) ?? 0) * Math.sqrt(365) : null,
    volumeRatio30d: volumeRatio(volumes),
    momentum7d: prices.length >= 8 && latest ? percentageChange(prices.at(-8), latest) : null,
    momentum30d: prices.length >= 31 && latest ? percentageChange(prices.at(-31), latest) : null,
    fearGreed: context.fearGreed ?? null,
    btcDominance: context.btcDominance ?? null,
    marketCapChange24h: context.marketCapChange24h ?? null
  };
}

export function featureVector(features: MarketFeatures) {
  return [
    scale01(features.rsi14, 0, 100),
    scaleSigned(features.macd, 0.05),
    scaleSigned(features.volatility30d, 1.4),
    scale01(features.volumeRatio30d, 0, 4),
    scaleSigned(features.momentum7d, 35),
    scaleSigned(features.momentum30d, 80),
    scale01(features.fearGreed, 0, 100),
    scale01(features.btcDominance, 25, 75),
    scaleSigned(features.marketCapChange24h, 12)
  ];
}

export function cosineSimilarity(a: number[], b: number[]) {
  let dot = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;
  for (let index = 0; index < Math.min(a.length, b.length); index += 1) {
    const av = Number.isFinite(a[index]) ? a[index] : 0;
    const bv = Number.isFinite(b[index]) ? b[index] : 0;
    dot += av * bv;
    magnitudeA += av * av;
    magnitudeB += bv * bv;
  }
  if (magnitudeA === 0 || magnitudeB === 0) return 0;
  return dot / (Math.sqrt(magnitudeA) * Math.sqrt(magnitudeB));
}

export function percentageChange(from: number | undefined, to: number | undefined) {
  if (!from || !to || from <= 0) return null;
  return ((to - from) / from) * 100;
}

export function maxDrawdown(points: HistoricalPoint[], startIndex: number, horizon: number) {
  const window = points.slice(startIndex, startIndex + horizon + 1);
  const startPrice = window[0]?.price;
  if (!startPrice || window.length < 2) return null;
  let trough = startPrice;
  for (const point of window) {
    trough = Math.min(trough, point.price);
  }
  return ((trough - startPrice) / startPrice) * 100;
}

export function inferRegime(features: MarketFeatures) {
  const rsiValue = features.rsi14 ?? 50;
  const momentum = features.momentum30d ?? 0;
  const fear = features.fearGreed ?? 50;

  if (rsiValue > 68 && fear > 70 && momentum > 12) return "Momentum greed";
  if (rsiValue < 38 && fear < 35 && momentum < -10) return "Capitulation recovery";
  if (momentum > 8 && rsiValue < 68) return "Accumulation breakout";
  if (momentum < -8 && rsiValue > 40) return "Distribution risk";
  return "Range compression";
}

function percentageReturns(prices: number[]) {
  const returns: number[] = [];
  for (let index = 1; index < prices.length; index += 1) {
    const change = percentageChange(prices[index - 1], prices[index]);
    if (change !== null) returns.push(change / 100);
  }
  return returns;
}

function rsi(prices: number[], period: number) {
  const window = prices.slice(-period - 1);
  let gains = 0;
  let losses = 0;
  for (let index = 1; index < window.length; index += 1) {
    const diff = window[index] - window[index - 1];
    if (diff >= 0) gains += diff;
    else losses += Math.abs(diff);
  }
  if (losses === 0) return 100;
  const rs = gains / period / (losses / period);
  return 100 - 100 / (1 + rs);
}

function ema(values: number[], period: number) {
  const multiplier = 2 / (period + 1);
  const result: number[] = [];
  values.forEach((value, index) => {
    if (index === 0) result.push(value);
    else result.push(value * multiplier + result[index - 1] * (1 - multiplier));
  });
  return result;
}

function macdHistogram(prices: number[]) {
  const ema12 = ema(prices, 12);
  const ema26 = ema(prices, 26);
  const macdLine = prices.map((_, index) => (ema12[index] ?? 0) - (ema26[index] ?? 0));
  const signal = ema(macdLine, 9);
  const latestPrice = prices.at(-1) ?? 1;
  return ((macdLine.at(-1) ?? 0) - (signal.at(-1) ?? 0)) / latestPrice;
}

function volumeRatio(volumes: Array<number | null>) {
  const valid = volumes.filter((volume): volume is number => Number.isFinite(volume ?? NaN) && (volume ?? 0) > 0);
  const latest = valid.at(-1);
  if (!latest || valid.length < 30) return null;
  const average = valid.slice(-30).reduce((sum, volume) => sum + volume, 0) / Math.min(valid.length, 30);
  return average > 0 ? latest / average : null;
}

function scale01(value: number | null | undefined, min: number, max: number) {
  if (value === null || value === undefined || !Number.isFinite(value)) return 0;
  return clamp((value - min) / (max - min), 0, 1);
}

function scaleSigned(value: number | null | undefined, divisor: number) {
  if (value === null || value === undefined || !Number.isFinite(value) || divisor === 0) return 0;
  return clamp(value / divisor, -1, 1);
}
