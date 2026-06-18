export type ApiIssue = {
  endpoint: string;
  message: string;
  statusCode?: number;
  recoverable: boolean;
};

export type EndpointState =
  | {
      ok: true;
      endpoint: string;
      label: string;
      updatedAt: string;
      credits?: number;
    }
  | {
      ok: false;
      endpoint: string;
      label: string;
      updatedAt: string;
      issue: ApiIssue;
    };

export type AssetQuote = {
  id?: number;
  name: string;
  symbol: string;
  slug?: string;
  rank?: number;
  price: number;
  volume24h?: number;
  volume7d?: number;
  volume30d?: number;
  volumeChange24h?: number;
  percentChange1h?: number;
  percentChange24h?: number;
  percentChange7d?: number;
  percentChange30d?: number;
  percentChange60d?: number;
  percentChange90d?: number;
  marketCap?: number;
  dominance?: number;
  circulatingSupply?: number;
  totalSupply?: number;
  maxSupply?: number;
  lastUpdated?: string;
};

export type HistoricalPoint = {
  timestamp: string;
  price: number;
  volume24h?: number;
  marketCap?: number;
};

export type FearGreedPoint = {
  timestamp: string;
  value: number;
  classification: string;
};

export type GlobalMetrics = {
  totalMarketCap?: number;
  totalVolume24h?: number;
  btcDominance?: number;
  ethDominance?: number;
  activeCryptocurrencies?: number;
  marketCapChange24h?: number;
  volumeChange24h?: number;
  lastUpdated?: string;
};

export type MarketFeatures = {
  rsi14: number | null;
  ema50: number | null;
  ema200: number | null;
  macd: number | null;
  volatility30d: number | null;
  volumeRatio30d: number | null;
  momentum7d: number | null;
  momentum30d: number | null;
  fearGreed: number | null;
  btcDominance: number | null;
  marketCapChange24h: number | null;
};

export type HistoricalTwin = {
  date: string;
  similarity: number;
  features: MarketFeatures;
  returns: {
    oneDay: number | null;
    sevenDay: number | null;
    fourteenDay: number | null;
    thirtyDay: number | null;
  };
  maxDrawdown14d: number | null;
  regime: string;
};

export type PredictionSummary = {
  bullishProbability: number | null;
  bearishProbability: number | null;
  averageReturn14d: number | null;
  averageReturn30d: number | null;
  averageDrawdown14d: number | null;
  riskLevel: "Low" | "Medium" | "High" | "Insufficient data";
  confidence: "Low" | "Medium" | "High" | "Insufficient data";
};

export type MarketTwinReport = {
  symbol: string;
  generatedAt: string;
  asset: AssetQuote | null;
  global: GlobalMetrics | null;
  fearGreed: FearGreedPoint | null;
  features: MarketFeatures;
  twins: HistoricalTwin[];
  prediction: PredictionSummary;
  explanation: string;
  dataCoverage: {
    historicalPoints: number;
    fearGreedPoints: number;
    endpoints: EndpointState[];
    issues: ApiIssue[];
  };
};

export type DexPair = {
  pairAddress?: string;
  baseSymbol?: string;
  quoteSymbol?: string;
  network?: string;
  priceUsd?: number;
  volume24h?: number;
  liquidity?: number;
  percentChange24h?: number;
  txns24h?: number;
  lastUpdated?: string;
};

export type DexMonitorResponse = {
  generatedAt: string;
  endpoint: EndpointState;
  pairs: DexPair[];
};
