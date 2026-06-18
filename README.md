# MarketTwin AI

MarketTwin AI is an AI market-pattern intelligence app for crypto research. It compares the current state of a tracked crypto asset with historical CoinMarketCap market states, ranks the closest historical twins, computes what happened after those matches, and uses OpenAI to explain the evidence in a bounded research brief.

The product is built as a production-style Next.js App Router app. API keys stay server-side, symbols are resolved through CoinMarketCap before quote calls, market outcomes are computed from live provider data and deterministic indicators, and endpoint coverage is shown instead of hidden.

## What It Does

- Runs live symbol analysis for assets such as BTC, ETH, SOL, and BNB.
- Pulls CoinMarketCap latest quotes, historical quotes, global market metrics, trending tokens, and Fear and Greed data.
- Builds a market fingerprint from RSI, EMA, MACD histogram, volatility, volume ratio, momentum, sentiment, and BTC dominance.
- Finds nearest historical market twins with cosine similarity.
- Computes forward 1d, 7d, 14d, and 30d returns plus 14d drawdown for matched regimes.
- Generates an OpenAI research explanation from the actual report JSON.
- Shows API health, endpoint credits, data coverage, and provider issues directly in the app.
- Protects public API routes with rate limits, optional Upstash Redis backing, shared analysis caching, and sanitized provider errors.
- Ships production metadata, favicons, HTTP headers, legal pages, and CI checks.

## How It Works

1. A user enters a market symbol in the analysis workbench.
2. `POST /api/analyze` sanitizes the symbol and checks the route rate limit.
3. The CMC service resolves the symbol through `/v1/cryptocurrency/map`.
4. Latest quote, historical quote, global market, and sentiment responses are normalized into app-level types.
5. The feature engine builds the current market fingerprint.
6. Historical windows are transformed into comparable feature vectors.
7. The twin engine ranks historical analogs by cosine similarity.
8. Prediction summaries are computed from the matched historical periods only.
9. OpenAI receives bounded report JSON and writes a research explanation.
10. The UI renders the report, endpoint coverage, confidence, and data notes.

No client component receives API keys. Missing provider data is reported as a limitation instead of being replaced with invented values.

## Pages

- `/` - agent command center with compact live analysis and market status.
- `/analyze` - full symbol analysis workflow.
- `/twins` - historical analog table and chart workflow.
- `/research` - feature, similarity, and explanation method.
- `/api-health` - runtime provider and key status.
- `/settings` - production configuration notes.
- `/risk` - research and market-risk disclosure.
- `/privacy` - privacy and provider-boundary notes.
- `/terms` - acceptable use and warranty boundaries.

## API Routes

- `POST /api/analyze` - returns a full MarketTwin report with explanation.
- `GET /api/market?symbol=BTC` - returns current market status and endpoint states.
- `GET /api/health` - checks CMC endpoints and probes the OpenAI Responses API.

`GET /api/health` can be protected with `API_HEALTH_ADMIN_TOKEN`. When configured, pass the token with `x-admin-token` or `Authorization: Bearer`.

## Architecture

```text
Next.js App Router
  app pages
  app API routes
  production metadata

Server services
  lib/cmc.ts              CoinMarketCap API client and normalizers
  lib/cmc-assets.ts       CMC map payload normalization and symbol fallback
  lib/rate-limit.ts       per-client route throttling with optional Redis backing
  lib/server-cache.ts     shared report cache with optional Redis backing
  lib/redis.ts            optional Upstash Redis client factory
  lib/admin.ts            health-route admin-token checks
  lib/provider-errors.ts  sanitized provider messages and diagnostics
  lib/market-twin.ts      report builder, historical twin search, prediction summary
  lib/indicators.ts       RSI, EMA, MACD, volatility, returns, similarity helpers
  lib/openai.ts           OpenAI explanation and health check
  lib/types.ts            shared report and endpoint types

Client surfaces
  AppShell
  LiveAnalysisWorkbench
  MarketStatusStrip
  ApiHealthPanel
  TwinChart
```

## Environment

Create `.env.local` for local development and use Vercel environment variables in production.

```bash
COINMARKETCAP_API_KEY=your_coinmarketcap_key
OPENAI_API_KEY=your_openai_key
OPENAI_MODEL=gpt-4o-mini
CMC_BASE_URL=https://pro-api.coinmarketcap.com
API_HEALTH_ADMIN_TOKEN=
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
NEXT_PUBLIC_APP_NAME=MarketTwin AI
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

`NEXT_PUBLIC_SITE_URL` should be set to the deployed domain in production. `API_HEALTH_ADMIN_TOKEN` is optional locally but recommended for public deployments. Upstash Redis is optional; without it, the app falls back to in-process memory for rate limits and short-lived analysis caching.

Rotate CMC and OpenAI keys immediately after any accidental exposure, including chat logs, tickets, screenshots, or terminal recordings.

## Run Locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`. If that port is busy:

```bash
npm run dev -- --port 3001
```

## Deployment

Production is deployed on Vercel:

- App: `https://markettwin-ai.vercel.app`
- Project: `markettwin-ai`
- Required production env vars: `COINMARKETCAP_API_KEY`, `OPENAI_API_KEY`, `OPENAI_MODEL`, `CMC_BASE_URL`, `NEXT_PUBLIC_APP_NAME`, `NEXT_PUBLIC_SITE_URL`

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
curl -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -d "{\"symbol\":\"BTC\"}"
```

## Production Notes

- Keep `.env.local` out of source control.
- Set `NEXT_PUBLIC_SITE_URL` to the production URL for canonical metadata and Open Graph output.
- Set `API_HEALTH_ADMIN_TOKEN` before exposing `/api-health` outside local development.
- Confirm `/api-health` before research sessions to verify CMC plan access and OpenAI availability.
- Configure Upstash Redis for multi-instance or serverless production so limits and analysis caches are shared across instances.
- Security headers are configured in `next.config.mjs`, including frame blocking, content-type protection, referrer policy, permissions policy, CSP, and production HSTS.
- OpenAI health checks are cached briefly and explanation calls have explicit timeouts with deterministic fallback text.
- CMC calls resolve symbols through CoinMarketCap's map endpoint and use stable asset IDs when available.
- The app is research software. It reports historical context, confidence limits, and data issues; it does not provide financial advice or trade instructions.
- CI is defined in `.github/workflows/ci.yml` and runs install, lint, typecheck, tests, production build, and dependency audit.

## Data Boundary

MarketTwin AI does not ship hardcoded market outcomes. The UI can show explanatory copy, empty states, and error states, but report metrics are computed from live API responses and deterministic indicator functions. If CMC or OpenAI cannot provide data, the app surfaces that limitation rather than filling the gap with invented values.

## Production Roadmap

The current app is a strong CMC and OpenAI powered research product. For a larger institutional system, the next backend layer should add durable historical storage, worker-based ingestion, queue-backed analysis jobs, funding and open-interest providers, social-sentiment ingestion, vector search for deeper historical pattern retrieval, observability dashboards, and role-based user accounts.
