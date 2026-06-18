import type { Metadata } from "next";
import type { CSSProperties } from "react";

import { Surface } from "@/components/ui/surface";

export const metadata: Metadata = {
  title: "Terms",
  description: "Use terms for MarketTwin AI.",
  alternates: {
    canonical: "/terms"
  }
};

export default function TermsPage() {
  return (
    <div className="page">
      <section className="hero-copy reveal" style={{ "--i": 0 } as CSSProperties}>
        <h1 className="page-title">Terms</h1>
        <p className="lede">
          Use MarketTwin AI as research software for live market pattern intelligence, not as a trading authority.
        </p>
      </section>
      <div className="panel-grid" data-cols="2">
        <Surface>
          <h2 className="section-title">Acceptable use</h2>
          <p>
            Do not overload API routes, scrape provider data, or attempt to extract server-side secrets. Public routes
            are rate-limited to protect provider quotas and app stability.
          </p>
        </Surface>
        <Surface>
          <h2 className="section-title">Market data</h2>
          <p>
            Data availability depends on CoinMarketCap endpoints, plan access, and provider uptime. Displayed values can
            update, disappear, or arrive with provider-specific latency.
          </p>
        </Surface>
        <Surface>
          <h2 className="section-title">AI summaries</h2>
          <p>
            AI explanations are generated from report data and bounded instructions. The deterministic report metrics
            remain the source of truth when AI output is unavailable.
          </p>
        </Surface>
        <Surface>
          <h2 className="section-title">No warranty</h2>
          <p>
            The app is provided for research workflows without guarantees of profit, accuracy, uninterrupted service, or
            fitness for a particular investment decision.
          </p>
        </Surface>
      </div>
    </div>
  );
}
