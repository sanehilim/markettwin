import type { Metadata } from "next";
import type { CSSProperties } from "react";

import { LiveAnalysisWorkbench } from "@/components/live-analysis-workbench";

export const metadata: Metadata = {
  title: "Historical Twins",
  description: "Inspect historical market analogs, similarity scores, forward returns, and drawdown context.",
  alternates: {
    canonical: "/twins"
  }
};

export default function TwinsPage() {
  return (
    <div className="page">
      <section className="hero-copy reveal" style={{ "--i": 0 } as CSSProperties}>
        <h1 className="page-title">Historical twins</h1>
        <p className="lede">
          Inspect the nearest past market states, their similarity scores, forward returns, drawdowns, and regime labels.
        </p>
      </section>
      <LiveAnalysisWorkbench autoRun initialSymbol="ETH" />
    </div>
  );
}
