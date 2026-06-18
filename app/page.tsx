import Link from "next/link";
import { ArrowRight, Database, GitCompareArrows } from "lucide-react";
import type { Metadata } from "next";
import type { CSSProperties } from "react";

import { LiveAnalysisWorkbench } from "@/components/live-analysis-workbench";
import { MarketStatusStrip } from "@/components/market-status-strip";
import { Surface } from "@/components/ui/surface";

export const metadata: Metadata = {
  alternates: {
    canonical: "/"
  }
};

export default function HomePage() {
  return (
    <div className="page">
      <div className="hero-workbench">
        <section className="hero-copy reveal" style={{ "--i": 0 } as CSSProperties}>
          <div className="badge-row">
            <span className="badge">CMC live data</span>
            <span className="badge">Historical analog engine</span>
          </div>
          <h1 className="hero-title">Find today’s market twin.</h1>
          <p className="lede">
            Compare the current crypto market fingerprint with prior regimes, then inspect what happened after the
            closest matches.
          </p>
          <div className="hero-actions">
            <Link href="/analyze" className="button">
              Run analysis <ArrowRight size={16} />
            </Link>
            <Link href="/research" className="button" data-variant="secondary">
              View method
            </Link>
          </div>
        </section>
        <LiveAnalysisWorkbench compact />
      </div>

      <div className="page-grid">
        <MarketStatusStrip />
        <div className="panel-grid" data-cols="2">
          <Surface>
            <GitCompareArrows size={22} />
            <h2 className="section-title">Analogs, not guesses</h2>
            <p>
              The engine builds a market vector from momentum, sentiment, volatility, volume, and dominance, then
              compares that vector with historical states.
            </p>
          </Surface>
          <Surface>
            <Database size={22} />
            <h2 className="section-title">Live endpoints stay visible</h2>
            <p>
              Each run reports the CMC endpoints it used, the historical coverage available, and any plan limits that
              affect the result.
            </p>
          </Surface>
        </div>
      </div>
    </div>
  );
}
