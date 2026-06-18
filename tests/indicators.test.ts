import { describe, expect, it } from "vitest";

import { computeFeatures, cosineSimilarity, percentageChange } from "@/lib/indicators";
import type { HistoricalPoint } from "@/lib/types";

describe("indicator helpers", () => {
  it("computes percentage changes safely", () => {
    expect(percentageChange(100, 112)).toBe(12);
    expect(percentageChange(0, 112)).toBeNull();
    expect(percentageChange(undefined, 112)).toBeNull();
  });

  it("returns bounded cosine similarity", () => {
    expect(cosineSimilarity([1, 0], [1, 0])).toBe(1);
    expect(cosineSimilarity([0, 0], [1, 0])).toBe(0);
  });

  it("computes market features only when enough history exists", () => {
    const history: HistoricalPoint[] = Array.from({ length: 60 }, (_, index) => ({
      timestamp: new Date(2024, 0, index + 1).toISOString(),
      price: 100 + index,
      volume24h: 1_000 + index * 10,
      marketCap: 10_000 + index * 100
    }));

    const features = computeFeatures(history, { fearGreed: 52, btcDominance: 58, marketCapChange24h: 1.2 });

    expect(features.rsi14).toBeGreaterThan(90);
    expect(features.ema50).toBeGreaterThan(100);
    expect(features.ema200).toBeNull();
    expect(features.fearGreed).toBe(52);
    expect(features.btcDominance).toBe(58);
  });
});
