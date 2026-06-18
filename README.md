# MarketTwin AI

MarketTwin AI is a crypto market pattern-intelligence app. It compares the current market state for a crypto asset with historical CoinMarketCap market states, ranks the closest "twins," computes what happened after those historical matches, and uses OpenAI to explain the evidence in plain research language.

The app is built as a production-style Next.js App Router project. API keys stay server-side, market data comes from live CoinMarketCap endpoints, asset symbols are resolved through CoinMarketCap's map endpoint before quote calls, on-chain liquidity comes from the CMC DEX API, and the UI exposes endpoint coverage instead of hiding provider or plan limits.

## What It Does

- Runs live symbol analysis for assets such as BTC, ETH, SOL, and BNB.
- Pulls CoinMarketCap latest quotes, historical quotes, global market metrics, and Fear and Greed data.
- Builds a market fingerprint from RSI, EMA, MACD histogram, volatility, volume ratio, momentum, sentiment, and BTC dominance.
- Finds the nearest historical market twins with cosine similarity.
- Computes forward 1d, 7d, 14d, and 30d returns plus 14d drawdown for matched regimes.
- Monitors DEX spot pairs through CoinMarketCap's DEX API for on-chain liquidity and volume context.
- Generates an OpenAI explanation from the actual report JSON.
- Shows API health, endpoint credits, data coverage, and provider issues directly in the app.
- Protects public API routes with server-side rate limits, optional Upstash Redis backing, shared analysis caching, and sanitized provider errors.
- Adds production HTTP headers, optional admin protection for `/api/health`, and a GitHub Actions CI workflow.
- Provides Privacy, Risk Disclosure, and Terms pages for production-facing usage boundaries.

## How It Works

1. A user enters a market symbol in the analysis workbench.
2. `/api/analyze` sanitizes the symbol and calls server-side CMC services.
3. The CMC service resolves the symbol through `/v1/cryptocurrency/map` and falls back to sanitized symbol lookup only when a stable ID is unavailable.
4. CMC responses are normalized into app-level market types.
5. The feature engine computes the current market fingerprint.
6. Historical windows are transformed into comparable feature vectors.
7. The twin engine ranks historical analogs by cosine similarity.
8. The prediction summary is computed from the matched periods only.
9. OpenAI receives the report data and writes a bounded explanation.
10. The UI renders the report, endpoint coverage, and data notes.

No client component receives API keys. Missing provider data is reported as an issue instead of being replaced with invented values.

## Pages

- `/` - live dashboard with the compact analysis workbench and market feed.
- `/analyze` - full symbol analysis workflow.
- `/twins` - historical analog table and chart workflow.
- `/research` - explanation of the feature and similarity method.
- `/onchain` - CMC DEX spot-pair monitor.
- `/api-health` - runtime key and endpoint status.
- `/api-health` accepts a session-only admin token when `API_HEALTH_ADMIN_TOKEN` is configured.
- `/settings` - production configuration notes.
- `/risk` - research and market-risk disclosure.
- `/privacy` - privacy and provider-boundary notes.
- `/terms` - acceptable use and warranty boundaries.

## API Routes

- `POST /api/analyze` - returns a full MarketTwin report with explanation.
- `GET /api/market?symbol=BTC` - returns current market status and endpoint states.
- `GET /api/onchain` - returns configured CMC DEX spot-pair rows.
- `GET /api/health` - checks CMC endpoints and probes the OpenAI Responses API. Set `API_HEALTH_ADMIN_TOKEN` to require `x-admin-token` or `Authorization: Bearer` access.

## Architecture

```text
Next.js App Router
  app pages
  app API routes

Server services
  lib/cmc.ts          CoinMarketCap API client and normalizers
  lib/cmc-assets.ts   CMC map payload normalization and symbol fallback
  lib/rate-limit.ts   per-client route throttling with Redis fallback support
  lib/server-cache.ts shared report cache with Redis fallback support
  lib/redis.ts        optional Upstash Redis client factory
  lib/admin.ts        health-route admin-token checks
  lib/provider-errors.ts sanitized provider messages and diagnostics
  lib/market-twin.ts  report builder, historical twin search, prediction summary
  lib/indicators.ts   RSI, EMA, MACD, volatility, returns, similarity helpers
  lib/openai.ts       OpenAI explanation and health check
  lib/types.ts        shared report and endpoint types

Client surfaces
  LiveAnalysisWorkbench
  MarketStatusStrip
  OnchainMonitor
  ApiHealthPanel
```

## Environment

Create `.env.local` for local development and use your hosting provider's secret store in production.

```bash
COINMARKETCAP_API_KEY=your_coinmarketcap_key
OPENAI_API_KEY=your_openai_key
OPENAI_MODEL=gpt-4o-mini
CMC_BASE_URL=https://pro-api.coinmarketcap.com
CMC_DEX_NETWORK_SLUG=ethereum
CMC_DEX_SLUG=uniswap-v3
CMC_DEX_PAIR_LIMIT=20
API_HEALTH_ADMIN_TOKEN=
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
NEXT_PUBLIC_APP_NAME=MarketTwin AI
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

`NEXT_PUBLIC_SITE_URL` should be changed to the deployed domain before production deployment.
`API_HEALTH_ADMIN_TOKEN` is optional locally, but recommended in production because `/api/health` reveals provider availability and endpoint access.
`UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are optional. Without them, the app falls back to in-process memory for rate limits and short-lived analysis caching.
Rotate CMC and OpenAI keys immediately after any accidental exposure, including chat logs, tickets, screenshots, or terminal recordings.

## Run Locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`. If that port is busy, run Next on another port:

```bash
npm run dev -- --port 3001
```

## Deployment

Production is deployed on Vercel:

- App: `https://markettwin-ai.vercel.app`
- Project: `markettwin-ai`
- Production env vars: `COINMARKETCAP_API_KEY`, `OPENAI_API_KEY`, `OPENAI_MODEL`, `CMC_BASE_URL`, `CMC_DEX_NETWORK_SLUG`, `CMC_DEX_SLUG`, `CMC_DEX_PAIR_LIMIT`, `NEXT_PUBLIC_APP_NAME`, `NEXT_PUBLIC_SITE_URL`

Deploy with:

```bash
npx vercel deploy --prod --yes
```

## Verification

```bash
npm run typecheck
npm run lint
npm run test
npm run build
npm audit --audit-level=moderate
```

Useful live checks after the dev server is running:

```bash
curl http://localhost:3000/api/health
curl http://localhost:3000/api/onchain
curl -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -d "{\"symbol\":\"BTC\"}"
```

## Production Notes

- Keep `.env.local` out of source control.
- Set `NEXT_PUBLIC_SITE_URL` to the production URL for canonical metadata and Open Graph output.
- Set `API_HEALTH_ADMIN_TOKEN` before exposing `/api-health` outside local development.
- Confirm `/api-health` before research sessions to verify CMC plan access and OpenAI availability.
- Tune `CMC_DEX_NETWORK_SLUG`, `CMC_DEX_SLUG`, and `CMC_DEX_PAIR_LIMIT` for the desired on-chain market surface.
- Public API routes include rate limits. Configure Upstash Redis for multi-instance or serverless production so limits and analysis caches are shared across instances.
- Security headers are configured in `next.config.mjs`, including frame blocking, content-type protection, referrer policy, permissions policy, CSP, and production HSTS.
- OpenAI health checks are cached briefly and explanation calls have explicit timeouts with deterministic fallback text.
- CMC calls resolve symbols through CoinMarketCap's map endpoint and use stable asset IDs when available.
- CMC DEX data is an on-chain market data surface supplied by CoinMarketCap; it is not a direct wallet or RPC node indexer.
- The app is research software. It reports historical context, confidence limits, and data issues; it does not provide financial advice or trade instructions.
- CI is defined in `.github/workflows/ci.yml` and runs install, lint, typecheck, tests, production build, and dependency audit.

## Data Boundary

MarketTwin AI does not ship hardcoded market outcomes. The UI can show explanatory copy, empty states, and error states, but report metrics are computed from live API responses and deterministic indicator functions. If CMC or OpenAI cannot provide data, the app surfaces that limitation rather than filling the gap with invented values.

## Production Roadmap

The current app is a strong CMC and OpenAI powered research product. For a larger institutional production system, the next backend layer should add durable historical storage, worker-based ingestion, queue-backed analysis jobs, direct chain indexers or RPC providers, funding and open-interest providers, wallet-flow enrichment, social-sentiment ingestion, vector search for deeper historical pattern retrieval, observability dashboards, and role-based user accounts. Those systems need provider contracts and deployment infrastructure beyond the local Next.js app.
