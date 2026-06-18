import type { Metadata } from "next";
import type { CSSProperties } from "react";

import { ApiHealthPanel } from "@/components/api-health-panel";

export const metadata: Metadata = {
  title: "API Health",
  description: "Check MarketTwin AI provider configuration, CMC endpoint access, and OpenAI availability.",
  alternates: {
    canonical: "/api-health"
  }
};

export default function ApiHealthPage() {
  return (
    <div className="page">
      <section className="hero-copy reveal" style={{ "--i": 0 } as CSSProperties}>
        <h1 className="page-title">API health</h1>
        <p className="lede">
          Verify secret configuration and endpoint access before running production research workflows.
        </p>
      </section>
      <ApiHealthPanel />
    </div>
  );
}
