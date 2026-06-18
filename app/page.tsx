import Link from "next/link";
import { ArrowRight, BrainCircuit, Database, Gauge, GitCompareArrows, ShieldCheck } from "lucide-react";
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

const agentStages = [
  {
    icon: Database,
    title: "Ingest live state",
    copy: "CoinMarketCap quotes, historical prices, global market metrics, and sentiment are normalized server-side."
  },
  {
    icon: Gauge,
    title: "Score the fingerprint",
    copy: "Momentum, RSI, MACD, volatility, volume ratio, dominance, and fear-greed become one comparable market vector."
  },
  {
    icon: GitCompareArrows,
    title: "Rank historical twins",
    copy: "The agent searches prior market states, calculates forward returns, and exposes data gaps before the brief is written."
  }
];

export default function HomePage() {
  return (
    <div className="page">
      <div className="hero-workbench">
        <section className="hero-copy reveal" style={{ "--i": 0 } as CSSProperties}>
          <div className="badge-row">
            <span className="badge">AI research agent</span>
            <span className="badge">Live CMC data</span>
            <span className="badge">Historical twin engine</span>
          </div>
          <h1 className="hero-title">Your AI market twin agent.</h1>
          <p className="lede">
            Ask for any tracked crypto symbol. MarketTwin reads the live market state, finds the closest historical
            regimes, and turns the evidence into a bounded research brief.
          </p>
          <dl className="agent-proof-strip" aria-label="Agent pipeline">
            <div>
              <dt>Input</dt>
              <dd>Symbol</dd>
            </div>
            <div>
              <dt>Model</dt>
              <dd>Feature vector</dd>
            </div>
            <div>
              <dt>Output</dt>
              <dd>Research brief</dd>
            </div>
          </dl>
          <div className="hero-actions">
            <Link href="/analyze" className="button">
              Open full agent <ArrowRight size={16} />
            </Link>
            <Link href="/research" className="button" data-variant="secondary">
              View method
            </Link>
          </div>
        </section>
        <LiveAnalysisWorkbench hero compact />
      </div>

      <div className="page-grid">
        <MarketStatusStrip />
        <div className="agent-architecture-grid">
          {agentStages.map((stage) => {
            const Icon = stage.icon;
            return (
              <Surface key={stage.title}>
                <Icon size={22} />
                <h2 className="section-title">{stage.title}</h2>
                <p>{stage.copy}</p>
              </Surface>
            );
          })}
        </div>
        <div className="panel-grid" data-cols="2">
          <Surface>
            <BrainCircuit size={22} />
            <h2 className="section-title">Agent-first workflow</h2>
            <p>
              The AI layer does not invent prices or predictions. It summarizes the live CMC-backed report, cites the
              nearest analog behavior, and keeps uncertainty visible.
            </p>
          </Surface>
          <Surface>
            <ShieldCheck size={22} />
            <h2 className="section-title">Production guardrails</h2>
            <p>
              Server-side keys, rate limits, provider health checks, symbol resolution, and endpoint coverage notes keep
              the research flow honest when a data plan or provider is constrained.
            </p>
          </Surface>
        </div>
      </div>
    </div>
  );
}
