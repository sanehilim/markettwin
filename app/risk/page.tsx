import type { Metadata } from "next";
import type { CSSProperties } from "react";

import { Surface } from "@/components/ui/surface";

export const metadata: Metadata = {
  title: "Risk Disclosure",
  description: "Risk boundaries for MarketTwin AI research output.",
  alternates: {
    canonical: "/risk"
  }
};

export default function RiskPage() {
  return (
    <div className="page">
      <section className="hero-copy reveal" style={{ "--i": 0 } as CSSProperties}>
        <h1 className="page-title">Risk disclosure</h1>
        <p className="lede">
          MarketTwin AI reports historical context. It does not know the future and does not provide financial advice.
        </p>
      </section>
      <div className="panel-grid" data-cols="2">
        <Surface tone="warning">
          <h2 className="section-title">Research only</h2>
          <p>
            Similar historical states can break down without warning. Market structure, liquidity, regulation, and
            macro conditions can change faster than historical analogs reflect.
          </p>
        </Surface>
        <Surface>
          <h2 className="section-title">No trade instructions</h2>
          <p>
            Bullish probability, forward return, risk, and confidence fields summarize prior matched windows. They are
            not buy, sell, leverage, or allocation instructions.
          </p>
        </Surface>
        <Surface>
          <h2 className="section-title">Provider limits</h2>
          <p>
            CMC plan access, endpoint availability, and API latency can affect coverage. The app surfaces endpoint gaps
            instead of replacing missing market data with invented values.
          </p>
        </Surface>
        <Surface>
          <h2 className="section-title">User responsibility</h2>
          <p>
            Validate data independently, consider your own risk tolerance, and consult qualified professionals before
            making financial decisions.
          </p>
        </Surface>
      </div>
    </div>
  );
}
