import type { Metadata } from "next";
import type { CSSProperties } from "react";

import { LiveAnalysisWorkbench } from "@/components/live-analysis-workbench";

export const metadata: Metadata = {
  title: "Analyze",
  description: "Run a live crypto symbol through the MarketTwin AI analog engine.",
  alternates: {
    canonical: "/analyze"
  }
};

export default function AnalyzePage() {
  return (
    <div className="page">
      <section className="hero-copy reveal" style={{ "--i": 0 } as CSSProperties}>
        <h1 className="page-title">Live twin analysis</h1>
        <p className="lede">
          Run a symbol through the full CMC to feature to similarity to explanation chain. Every reported value comes
          from live API responses and computed indicators.
        </p>
      </section>
      <LiveAnalysisWorkbench autoRun initialSymbol="BTC" />
    </div>
  );
}
