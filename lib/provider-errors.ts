export function cmcPublicMessage(statusCode?: number, errorCode?: number) {
  if (statusCode === 400) return "CoinMarketCap rejected the request parameters.";
  if (statusCode === 401 || errorCode === 1001 || errorCode === 1002) {
    return "CoinMarketCap authentication failed. Check the server API key.";
  }
  if (statusCode === 402) return "CoinMarketCap billing or plan activation is blocking this endpoint.";
  if (statusCode === 403) return "The configured CoinMarketCap plan does not allow this endpoint.";
  if (statusCode === 404) return "CoinMarketCap did not return data for this market.";
  if (statusCode === 429) return "CoinMarketCap rate limits were reached. Wait briefly and retry.";
  if (statusCode && statusCode >= 500) return "CoinMarketCap is temporarily unavailable. Retry shortly.";
  return "CoinMarketCap could not complete this request.";
}

export function openAiPublicMessage() {
  return "OpenAI could not complete the request right now. The deterministic research summary is still available.";
}

export function logProviderIssue(
  provider: "coinmarketcap" | "openai",
  details: Record<string, string | number | boolean | undefined>
) {
  if (process.env.NODE_ENV === "test") return;
  console.warn(`[${provider}] provider request issue`, details);
}
