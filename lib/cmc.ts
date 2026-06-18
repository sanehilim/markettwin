import "server-only";

import { fallbackCmcAssetLookup, normalizeCmcMapLookup, type CmcAssetLookup } from "@/lib/cmc-assets";
import { appConfig, hasCmcKey } from "@/lib/config";
import { cmcPublicMessage, logProviderIssue } from "@/lib/provider-errors";
import type {
  ApiIssue,
  AssetQuote,
  EndpointState,
  FearGreedPoint,
  GlobalMetrics,
  HistoricalPoint
} from "@/lib/types";
import { isoDate } from "@/lib/utils";

type CmcResult<T> =
  | {
      ok: true;
      endpoint: string;
      label: string;
      data: T;
      status?: { credit_count?: number; timestamp?: string };
      endpointState: EndpointState;
    }
  | {
      ok: false;
      endpoint: string;
      label: string;
      issue: ApiIssue;
      endpointState: EndpointState;
    };

const CMC_TIMEOUT_MS = 16000;
const CMC_RETRY_DELAYS_MS = [350, 900];
const CMC_MAP_CACHE_MS = 24 * 60 * 60 * 1000;

const assetLookupCache = new Map<string, { expiresAt: number; lookup: CmcAssetLookup }>();
const pendingAssetLookups = new Map<string, Promise<CmcAssetLookup>>();

export async function cmcGet<T>(
  endpoint: string,
  params: Record<string, string | number | boolean | undefined>,
  label: string,
  options: { required?: boolean; revalidate?: number } = {}
): Promise<CmcResult<T>> {
  let url: URL;
  try {
    url = new URL(endpoint, appConfig.cmcBaseUrl);
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== "") {
        url.searchParams.set(key, String(value));
      }
    }
  } catch {
    return failed(endpoint, label, {
      endpoint,
      message: "CoinMarketCap base URL is not valid. Check CMC_BASE_URL.",
      recoverable: true
    });
  }

  if (!hasCmcKey()) {
    const issue = {
      endpoint,
      message: "CoinMarketCap API key is not configured. Add COINMARKETCAP_API_KEY to .env.local.",
      recoverable: true
    };
    return failed(endpoint, label, issue);
  }

  for (let attempt = 0; attempt <= CMC_RETRY_DELAYS_MS.length; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), CMC_TIMEOUT_MS);

    try {
      const response = await fetch(url, {
        headers: {
          Accept: "application/json",
          "X-CMC_PRO_API_KEY": appConfig.cmcApiKey
        },
        cache: options.revalidate ? "force-cache" : "no-store",
        next: options.revalidate ? { revalidate: options.revalidate } : undefined,
        signal: controller.signal
      });
      const payload = await response.json().catch(() => null);
      const status = payload?.status;

      const errorCode = Number(status?.error_code ?? 0);
      if (!response.ok || errorCode !== 0) {
        const retryable = response.status === 429 || response.status >= 500;
        if (retryable && attempt < CMC_RETRY_DELAYS_MS.length) {
          clearTimeout(timeout);
          await wait(CMC_RETRY_DELAYS_MS[attempt]);
          continue;
        }

        logProviderIssue("coinmarketcap", {
          endpoint,
          statusCode: response.status,
          errorCode,
          errorMessage: String(status?.error_message ?? response.statusText ?? "")
        });

        return failed(endpoint, label, {
          endpoint,
          message: cmcPublicMessage(response.status, errorCode),
          statusCode: response.status,
          recoverable: response.status === 402 || response.status === 403 || response.status === 429
        });
      }

      return {
        ok: true,
        endpoint,
        label,
        data: payload?.data ?? payload,
        status,
        endpointState: {
          ok: true,
          endpoint,
          label,
          updatedAt: new Date().toISOString(),
          credits: status?.credit_count
        }
      };
    } catch (error) {
      if (attempt < CMC_RETRY_DELAYS_MS.length) {
        clearTimeout(timeout);
        await wait(CMC_RETRY_DELAYS_MS[attempt]);
        continue;
      }

      logProviderIssue("coinmarketcap", {
        endpoint,
        errorMessage: error instanceof Error ? error.message : "unknown error"
      });

      return failed(endpoint, label, {
        endpoint,
        message:
          error instanceof DOMException && error.name === "AbortError"
            ? "CoinMarketCap request timed out. Try again shortly."
            : "CoinMarketCap is temporarily unavailable. Try again shortly.",
        recoverable: true
      });
    } finally {
      clearTimeout(timeout);
    }
  }

  return failed(endpoint, label, {
    endpoint,
    message: "CoinMarketCap could not complete this request.",
    recoverable: true
  });
}

function failed(endpoint: string, label: string, issue: ApiIssue): CmcResult<never> {
  return {
    ok: false,
    endpoint,
    label,
    issue,
    endpointState: {
      ok: false,
      endpoint,
      label,
      updatedAt: new Date().toISOString(),
      issue
    }
  };
}

export async function getLatestQuote(symbol: string) {
  const { params, requestedSymbol } = await resolveCmcAssetLookup(symbol || "BTC");
  const result = await cmcGet<unknown[] | Record<string, unknown>>(
    "/v3/cryptocurrency/quotes/latest",
    {
      ...params,
      convert: "USD",
      skip_invalid: "true",
      aux: "num_market_pairs,cmc_rank,max_supply,circulating_supply,total_supply,volume_7d,volume_30d"
    },
    "Latest asset quote",
    { required: true, revalidate: 60 }
  );

  if (!result.ok) return result;
  const asset = normalizeAssetQuote(result.data, requestedSymbol);
  if (!asset) {
    return failed("/v3/cryptocurrency/quotes/latest", "Latest asset quote", {
      endpoint: "/v3/cryptocurrency/quotes/latest",
      message: `CoinMarketCap did not return a live quote for ${requestedSymbol}. Use a tracked CMC symbol.`,
      statusCode: 404,
      recoverable: true
    });
  }

  return {
    ...result,
    data: asset
  };
}

export async function getHistoricalQuotes(symbol: string) {
  const { params, requestedSymbol } = await resolveCmcAssetLookup(symbol || "BTC");
  const result = await cmcGet<unknown>(
    "/v3/cryptocurrency/quotes/historical",
    {
      ...params,
      convert: "USD",
      interval: "daily",
      count: 420
    },
    "Historical quotes",
    { revalidate: 300 }
  );

  if (!result.ok) return result;
  return {
    ...result,
    data: normalizeHistoricalQuotes(result.data, requestedSymbol)
  };
}

export async function getGlobalMetrics() {
  const result = await cmcGet<unknown>(
    "/v1/global-metrics/quotes/latest",
    { convert: "USD" },
    "Global market metrics",
    { required: true, revalidate: 300 }
  );

  if (!result.ok) return result;
  return {
    ...result,
    data: normalizeGlobalMetrics(result.data)
  };
}

export async function getFearGreedLatest() {
  const result = await cmcGet<unknown>("/v3/fear-and-greed/latest", {}, "Fear and Greed", {
    required: true,
    revalidate: 900
  });

  if (!result.ok) return result;
  return {
    ...result,
    data: normalizeFearGreedLatest(result.data)
  };
}

export async function getFearGreedHistorical(limit = 420) {
  const result = await cmcGet<unknown>(
    "/v3/fear-and-greed/historical",
    { limit },
    "Fear and Greed history",
    { revalidate: 900 }
  );

  if (!result.ok) return result;
  return {
    ...result,
    data: normalizeFearGreedHistorical(result.data)
  };
}

export async function getTrendingTokens() {
  const result = await cmcGet<unknown>(
    "/v1/cryptocurrency/trending/latest",
    { limit: 10, convert: "USD" },
    "Trending tokens",
    { revalidate: 300 }
  );

  if (!result.ok) return result;
  return {
    ...result,
    data: normalizeTrending(result.data)
  };
}

export async function getKeyInfo() {
  return cmcGet<unknown>("/v1/key/info", {}, "CMC key info", { revalidate: 300 });
}

function normalizeAssetQuote(payload: unknown, requestedSymbol: string): AssetQuote | null {
  const entries = Array.isArray(payload) ? payload : Object.values((payload as Record<string, unknown>) ?? {});
  const asset = entries.find((entry) => {
    const item = entry as Record<string, unknown>;
    return String(item.symbol ?? "").toUpperCase() === requestedSymbol;
  }) as Record<string, unknown> | undefined;

  if (!asset) return null;
  const quote = pickUsdQuote(asset.quote);

  return {
    id: numberOrUndefined(asset.id),
    name: String(asset.name ?? requestedSymbol),
    symbol: String(asset.symbol ?? requestedSymbol),
    slug: stringOrUndefined(asset.slug),
    rank: numberOrUndefined(asset.cmc_rank),
    price: numberOrZero(quote?.price),
    volume24h: numberOrUndefined(quote?.volume_24h),
    volume7d: numberOrUndefined(quote?.volume_7d),
    volume30d: numberOrUndefined(quote?.volume_30d),
    volumeChange24h: numberOrUndefined(quote?.volume_change_24h),
    percentChange1h: numberOrUndefined(quote?.percent_change_1h),
    percentChange24h: numberOrUndefined(quote?.percent_change_24h),
    percentChange7d: numberOrUndefined(quote?.percent_change_7d),
    percentChange30d: numberOrUndefined(quote?.percent_change_30d),
    percentChange60d: numberOrUndefined(quote?.percent_change_60d),
    percentChange90d: numberOrUndefined(quote?.percent_change_90d),
    marketCap: numberOrUndefined(quote?.market_cap),
    dominance: numberOrUndefined(quote?.market_cap_dominance),
    circulatingSupply: numberOrUndefined(asset.circulating_supply),
    totalSupply: numberOrUndefined(asset.total_supply),
    maxSupply: numberOrUndefined(asset.max_supply),
    lastUpdated: stringOrUndefined(quote?.last_updated ?? asset.last_updated)
  };
}

function normalizeHistoricalQuotes(payload: unknown, requestedSymbol: string): HistoricalPoint[] {
  const data = payload as Record<string, unknown>;
  const directQuotes = Array.isArray(data?.quotes) ? (data.quotes as unknown[]) : null;
  const asset =
    selectHistoricalAsset(data?.[requestedSymbol]) ??
    selectHistoricalAsset(
      Object.values(data ?? {}).find((value) => {
      const entry = value as Record<string, unknown>;
      return String(entry.symbol ?? "").toUpperCase() === requestedSymbol || Array.isArray(entry.quotes);
      })
    );
  const quotes = directQuotes
    ? directQuotes
    : Array.isArray((asset as Record<string, unknown>)?.quotes)
    ? ((asset as Record<string, unknown>).quotes as unknown[])
    : Array.isArray(payload)
      ? (payload as unknown[])
      : [];

  return quotes
    .map((entry) => {
      const item = entry as Record<string, unknown>;
      const quote = pickUsdQuote(item.quote);
      return {
        timestamp: stringOrUndefined(item.timestamp ?? item.time_open ?? item.last_updated) ?? "",
        price: numberOrZero(quote?.price),
        volume24h: numberOrUndefined(quote?.volume_24h),
        marketCap: numberOrUndefined(quote?.market_cap)
      };
    })
    .filter((point) => point.timestamp && Number.isFinite(point.price) && point.price > 0)
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
}

function selectHistoricalAsset(candidate: unknown): Record<string, unknown> | undefined {
  if (!candidate) return undefined;
  if (Array.isArray(candidate)) {
    return candidate
      .filter((entry) => Array.isArray((entry as Record<string, unknown>).quotes))
      .sort((a, b) => historicalMarketCap(b) - historicalMarketCap(a))[0] as Record<string, unknown> | undefined;
  }
  return candidate as Record<string, unknown>;
}

function historicalMarketCap(candidate: unknown) {
  const quotes = (candidate as Record<string, unknown>)?.quotes as unknown[] | undefined;
  const first = Array.isArray(quotes) ? (quotes.find(Boolean) as Record<string, unknown> | undefined) : undefined;
  const quote = pickUsdQuote(first?.quote);
  return Number(quote?.market_cap ?? 0) || 0;
}

function normalizeGlobalMetrics(payload: unknown): GlobalMetrics {
  const item = (payload ?? {}) as Record<string, unknown>;
  const quote = pickUsdQuote(item.quote);
  return {
    totalMarketCap: numberOrUndefined(quote?.total_market_cap),
    totalVolume24h: numberOrUndefined(quote?.total_volume_24h),
    btcDominance: numberOrUndefined(item.btc_dominance),
    ethDominance: numberOrUndefined(item.eth_dominance),
    activeCryptocurrencies: numberOrUndefined(item.active_cryptocurrencies),
    marketCapChange24h: numberOrUndefined(quote?.total_market_cap_yesterday_percentage_change),
    volumeChange24h: numberOrUndefined(quote?.total_volume_24h_yesterday_percentage_change),
    lastUpdated: stringOrUndefined(item.last_updated ?? quote?.last_updated)
  };
}

function normalizeFearGreedLatest(payload: unknown): FearGreedPoint | null {
  const item = (payload ?? {}) as Record<string, unknown>;
  const value = numberOrUndefined(item.value);
  if (value === undefined) return null;
  return {
    timestamp: stringOrUndefined(item.update_time) ?? new Date().toISOString(),
    value,
    classification: String(item.value_classification ?? "Unclassified")
  };
}

function normalizeFearGreedHistorical(payload: unknown): FearGreedPoint[] {
  const data = payload as Record<string, unknown>;
  const rows = Array.isArray(payload) ? payload : Array.isArray(data?.data) ? (data.data as unknown[]) : [];
  return rows
    .map((entry) => {
      const item = entry as Record<string, unknown>;
      return {
        timestamp: typeof item.timestamp === "number" ? isoDate(item.timestamp) : String(item.timestamp ?? ""),
        value: numberOrZero(item.value),
        classification: String(item.value_classification ?? "Unclassified")
      };
    })
    .filter((point) => point.timestamp && Number.isFinite(point.value));
}

function normalizeTrending(payload: unknown) {
  if (Array.isArray(payload)) return payload.slice(0, 10);
  const data = payload as Record<string, unknown>;
  return Array.isArray(data?.data) ? data.data.slice(0, 10) : [];
}

function pickUsdQuote(quote: unknown): Record<string, unknown> | null {
  if (!quote) return null;
  if (Array.isArray(quote)) {
    return (
      (quote.find((entry) => String((entry as Record<string, unknown>).symbol ?? "").toUpperCase() === "USD") as
        | Record<string, unknown>
        | undefined) ?? (quote[0] as Record<string, unknown> | undefined) ?? null
    );
  }
  const record = quote as Record<string, unknown>;
  return (record.USD as Record<string, unknown> | undefined) ?? record;
}

function numberOrUndefined(value: unknown) {
  const number = Number(value);
  return Number.isFinite(number) ? number : undefined;
}

function numberOrZero(value: unknown) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function stringOrUndefined(value: unknown) {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function resolveCmcAssetLookup(symbol: string): Promise<CmcAssetLookup> {
  const fallback = fallbackCmcAssetLookup(symbol);
  const key = fallback.requestedSymbol;
  const cached = assetLookupCache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.lookup;

  const pending = pendingAssetLookups.get(key);
  if (pending) return pending;

  const lookupPromise = loadCmcAssetLookup(fallback).finally(() => {
    pendingAssetLookups.delete(key);
  });
  pendingAssetLookups.set(key, lookupPromise);
  return lookupPromise;
}

async function loadCmcAssetLookup(fallback: CmcAssetLookup): Promise<CmcAssetLookup> {
  const result = await cmcGet<unknown>(
    "/v1/cryptocurrency/map",
    { symbol: fallback.requestedSymbol },
    "CMC asset map",
    { revalidate: 86_400 }
  );

  const lookup = result.ok ? (normalizeCmcMapLookup(result.data, fallback.requestedSymbol) ?? fallback) : fallback;
  assetLookupCache.set(fallback.requestedSymbol, {
    expiresAt: Date.now() + CMC_MAP_CACHE_MS,
    lookup
  });
  return lookup;
}
