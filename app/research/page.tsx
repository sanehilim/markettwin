import type { Metadata } from "next";
import { BrainCircuit, Database, Gauge, ShieldAlert } from "lucide-react";
import type { CSSProperties } from "react";

import { Surface } from "@/components/ui/surface";

export const metadata: Metadata = {
  title: "Research Method",
  description: "Learn how MarketTwin AI builds market fingerprints and ranks historical analogs.",
  alternates: {
    canonical: "/research"
  }
};

export default function ResearchPage() {
  return (
    <div className="page">
      <section className="hero-copy reveal" style={{ "--i": 0 } as CSSProperties}>
        <h1 className="page-title">The analog method</h1>
        <p className="lede">
          MarketTwin treats today as a market state, not a price target. The app compares state vectors, measures what
          followed, and explains the evidence plainly.
        </p>
      </section>

      <div className="panel-grid" data-cols="2">
        <Surface>
          <Database size={22} />
          <h2 className="section-title">Data intake</h2>
          <p>
            Latest quotes, historical quotes, global metrics, sentiment, and DEX spot-pair data are pulled through
            server-side CMC routes so API keys never reach the browser.
          </p>
        </Surface>
        <Surface>
          <Gauge size={22} />
          <h2 className="section-title">Feature extraction</h2>
          <p>
            RSI, EMA, MACD histogram, volatility, volume ratio, momentum, Fear and Greed, and dominance form the market
            fingerprint.
          </p>
        </Surface>
        <Surface>
          <BrainCircuit size={22} />
          <h2 className="section-title">Similarity engine</h2>
          <p>
            The current vector is compared against historical vectors with cosine similarity. Outcomes are computed from
            the matched periods only.
          </p>
        </Surface>
        <Surface>
          <ShieldAlert size={22} />
          <h2 className="section-title">Risk boundary</h2>
          <p>
            Explanations are generated from the report JSON and framed as historical context. The app avoids trade
            instructions and does not invent missing metrics.
          </p>
        </Surface>
      </div>

      <Surface className="reveal" style={{ "--i": 1 } as CSSProperties}>
        <h2 className="section-title">Engine chain</h2>
        <ol className="steps">
          <li className="step">
            <span className="stage">1.0</span>
            <h3>Collect live state.</h3>
            <p>CMC quotes, global metrics, and sentiment establish the current market fingerprint.</p>
          </li>
          <li className="step">
            <span className="stage">2.0</span>
            <h3>Build historical vectors.</h3>
            <p>Historical quote windows are transformed into comparable feature vectors.</p>
          </li>
          <li className="step">
            <span className="stage">3.0</span>
            <h3>Rank the nearest twins.</h3>
            <p>The closest regimes are ranked by cosine similarity and filtered into a readable twin table.</p>
          </li>
          <li className="step">
            <span className="stage">4.0</span>
            <h3>Explain the evidence.</h3>
            <p>OpenAI summarizes the actual report data, including endpoint gaps and confidence limits.</p>
          </li>
        </ol>
      </Surface>
    </div>
  );
}
