"use client";

import { Activity, AlertCircle, CheckCircle2 } from "lucide-react";
import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Surface } from "@/components/ui/surface";
import { formatCurrency, formatPercent } from "@/lib/utils";

type MarketPayload = {
  generatedAt: string;
  symbol: string;
  asset: {
    price?: number;
    percentChange24h?: number;
    percentChange7d?: number;
  } | null;
  global: {
    totalMarketCap?: number;
    btcDominance?: number;
  } | null;
  fearGreed: {
    value: number;
    classification: string;
  } | null;
  endpoints: Array<{ ok: boolean; label: string }>;
};

export function MarketStatusStrip({ symbol = "BTC" }: { symbol?: string }) {
  const [payload, setPayload] = useState<MarketPayload | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    fetch(`/api/market?symbol=${encodeURIComponent(symbol)}`)
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data?.error ?? "Market status could not load.");
        return data;
      })
      .then((data) => {
        if (active) setPayload(data);
      })
      .catch((caught) => {
        if (active) setError(caught instanceof Error ? caught.message : "Market status could not load.");
      });
    return () => {
      active = false;
    };
  }, [symbol]);

  if (error) {
    return (
      <Surface tone="error">
        <Badge tone="error" icon={<AlertCircle size={14} />}>
          Market feed
        </Badge>
        <p>{error}</p>
      </Surface>
    );
  }

  if (!payload) {
    return (
      <Surface>
        <div className="skeleton" />
        <div className="skeleton" />
      </Surface>
    );
  }

  const ok = payload.endpoints.filter((endpoint) => endpoint.ok).length;

  return (
    <Surface>
      <div className="section-actions">
        <h2 className="section-title">Live market feed</h2>
        <Badge tone={ok === payload.endpoints.length ? "success" : "warning"} icon={<Activity size={14} />}>
          {ok}/{payload.endpoints.length} endpoints
        </Badge>
      </div>
      <div className="stat-strip">
        <Metric label={`${payload.symbol} price`} value={formatCurrency(payload.asset?.price)} />
        <Metric label="24h move" value={formatPercent(payload.asset?.percentChange24h)} />
        <Metric label="Fear & Greed" value={payload.fearGreed ? `${payload.fearGreed.value}` : "—"} />
        <Metric label="BTC dominance" value={formatPercent(payload.global?.btcDominance)} />
      </div>
      <div className="badge-row">
        {payload.endpoints.map((endpoint) => (
          <Badge
            icon={endpoint.ok ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
            key={endpoint.label}
            tone={endpoint.ok ? "success" : "error"}
          >
            {endpoint.label}
          </Badge>
        ))}
      </div>
    </Surface>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <span className="metric">
      <span className="metric-value">{value}</span>
      <span className="metric-label">{label}</span>
    </span>
  );
}
