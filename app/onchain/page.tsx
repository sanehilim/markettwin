import type { Metadata } from "next";
import type { CSSProperties } from "react";

import { OnchainMonitor } from "@/components/onchain-monitor";

export const metadata: Metadata = {
  title: "On-chain Monitor",
  description: "Monitor CoinMarketCap DEX spot-pair liquidity and volume as an on-chain market layer.",
  alternates: {
    canonical: "/onchain"
  }
};

export default function OnchainPage() {
  return (
    <div className="page">
      <section className="hero-copy reveal" style={{ "--i": 0 } as CSSProperties}>
        <h1 className="page-title">On-chain market surface</h1>
        <p className="lede">
          Monitor CMC DEX spot-pair data as an additional signal layer for liquidity, volume, and short-term on-chain
          pressure.
        </p>
      </section>
      <OnchainMonitor />
    </div>
  );
}
