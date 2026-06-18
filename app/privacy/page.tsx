import type { Metadata } from "next";
import type { CSSProperties } from "react";

import { Surface } from "@/components/ui/surface";

export const metadata: Metadata = {
  title: "Privacy",
  description: "Privacy practices for MarketTwin AI.",
  alternates: {
    canonical: "/privacy"
  }
};

export default function PrivacyPage() {
  return (
    <div className="page">
      <section className="hero-copy reveal" style={{ "--i": 0 } as CSSProperties}>
        <h1 className="page-title">Privacy</h1>
        <p className="lede">
          MarketTwin AI is designed so provider keys stay server-side and market analysis inputs do not require an
          account.
        </p>
      </section>
      <div className="panel-grid" data-cols="2">
        <Surface>
          <h2 className="section-title">Data processed</h2>
          <p>
            Symbol searches, provider health checks, and DEX monitor refreshes are processed to return live market
            research. The app does not ask for wallet seed phrases, exchange credentials, or payment information.
          </p>
        </Surface>
        <Surface>
          <h2 className="section-title">Provider boundary</h2>
          <p>
            CoinMarketCap receives server-side market data requests. OpenAI receives bounded report JSON only for
            explanation generation when the API key is configured.
          </p>
        </Surface>
        <Surface>
          <h2 className="section-title">Local secrets</h2>
          <p>
            API keys belong in `.env.local` locally and in the deployment provider&apos;s secret store in production.
            They must not be committed, logged, or shared in support transcripts.
          </p>
        </Surface>
        <Surface>
          <h2 className="section-title">Operational logs</h2>
          <p>
            Server logs should keep provider diagnostics high-level and avoid raw API keys or full provider error
            payloads.
          </p>
        </Surface>
      </div>
    </div>
  );
}
