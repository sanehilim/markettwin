import { sanitizeSymbol } from "@/lib/utils";

export type CmcAssetLookup = {
  requestedSymbol: string;
  params: { id: number } | { symbol: string };
  source: "cmc-map" | "symbol-fallback";
};

export function fallbackCmcAssetLookup(symbol: string): CmcAssetLookup {
  const requestedSymbol = sanitizeSymbol(symbol || "BTC");
  return {
    requestedSymbol,
    params: { symbol: requestedSymbol },
    source: "symbol-fallback"
  };
}

export function normalizeCmcMapLookup(payload: unknown, symbol: string): CmcAssetLookup | null {
  const requestedSymbol = sanitizeSymbol(symbol || "BTC");
  const rows = Array.isArray(payload)
    ? payload
    : Array.isArray((payload as Record<string, unknown>)?.data)
      ? ((payload as Record<string, unknown>).data as unknown[])
      : [];

  const candidates = rows
    .map((entry) => entry as Record<string, unknown>)
    .filter((entry) => String(entry.symbol ?? "").toUpperCase() === requestedSymbol);

  const best = candidates.sort((a, b) => rankScore(a) - rankScore(b))[0];
  const id = Number(best?.id);

  if (!Number.isFinite(id) || id <= 0) return null;

  return {
    requestedSymbol,
    params: { id },
    source: "cmc-map"
  };
}

function rankScore(entry: Record<string, unknown>) {
  const rank = Number(entry.rank ?? entry.cmc_rank);
  return Number.isFinite(rank) && rank > 0 ? rank : Number.POSITIVE_INFINITY;
}
