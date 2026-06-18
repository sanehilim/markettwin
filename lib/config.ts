export const appConfig = {
  name: process.env.NEXT_PUBLIC_APP_NAME ?? "MarketTwin AI",
  siteUrl: siteUrl(),
  cmcBaseUrl: process.env.CMC_BASE_URL ?? "https://pro-api.coinmarketcap.com",
  cmcApiKey: process.env.COINMARKETCAP_API_KEY ?? "",
  cmcDexNetworkSlug: process.env.CMC_DEX_NETWORK_SLUG ?? "ethereum",
  cmcDexSlug: process.env.CMC_DEX_SLUG ?? "uniswap-v3",
  cmcDexPairLimit: positiveInteger(process.env.CMC_DEX_PAIR_LIMIT, 20),
  openaiApiKey: process.env.OPENAI_API_KEY ?? "",
  openaiModel: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
  apiHealthAdminToken: process.env.API_HEALTH_ADMIN_TOKEN ?? "",
  upstashRedisRestUrl: process.env.UPSTASH_REDIS_REST_URL ?? "",
  upstashRedisRestToken: process.env.UPSTASH_REDIS_REST_TOKEN ?? ""
};

export function hasCmcKey() {
  return appConfig.cmcApiKey.trim().length > 0;
}

export function hasOpenAiKey() {
  return appConfig.openaiApiKey.trim().length > 0;
}

export function hasApiHealthAdminToken() {
  return appConfig.apiHealthAdminToken.trim().length > 0;
}

export function hasSharedStore() {
  return appConfig.upstashRedisRestUrl.trim().length > 0 && appConfig.upstashRedisRestToken.trim().length > 0;
}

function safeUrl(value: string | undefined, fallback: string) {
  try {
    return new URL(value ?? fallback).origin;
  } catch {
    return fallback;
  }
}

function siteUrl() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  const vercelProduction = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  const vercelDeployment = process.env.VERCEL_URL?.trim();
  const candidate = configured || withHttps(vercelProduction) || withHttps(vercelDeployment);
  return safeUrl(candidate, "http://localhost:3000");
}

function withHttps(value: string | undefined) {
  if (!value) return undefined;
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}

function positiveInteger(value: string | undefined, fallback: number) {
  const number = Number(value ?? fallback);
  return Number.isFinite(number) && number > 0 ? Math.trunc(number) : fallback;
}
