import { describe, expect, it } from "vitest";

import { fallbackCmcAssetLookup, normalizeCmcMapLookup } from "@/lib/cmc-assets";

describe("CoinMarketCap asset lookup helpers", () => {
  it("normalizes CoinMarketCap map payloads into stable IDs", () => {
    expect(
      normalizeCmcMapLookup(
        {
          data: [
            { id: 999999, symbol: "ETH", rank: 3000 },
            { id: 1027, symbol: "ETH", rank: 2 }
          ]
        },
        " eth "
      )
    ).toEqual({
      requestedSymbol: "ETH",
      params: { id: 1027 },
      source: "cmc-map"
    });
  });

  it("falls back to a sanitized symbol for unknown assets", () => {
    expect(fallbackCmcAssetLookup(" new-coin!!! ")).toEqual({
      requestedSymbol: "NEWCOIN",
      params: { symbol: "NEWCOIN" },
      source: "symbol-fallback"
    });
  });

  it("returns null when the CMC map payload has no usable asset ID", () => {
    expect(normalizeCmcMapLookup({ data: [{ id: null, symbol: "ABC" }] }, "ABC")).toBeNull();
  });
});
