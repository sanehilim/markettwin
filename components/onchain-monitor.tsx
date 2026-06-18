"use client";

import { AlertCircle, CheckCircle2, RefreshCw } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Surface } from "@/components/ui/surface";
import type { DexMonitorResponse } from "@/lib/types";
import { compactNumber, formatCurrency, formatPercent } from "@/lib/utils";

export function OnchainMonitor() {
  const [payload, setPayload] = useState<DexMonitorResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const activeRequestRef = useRef<AbortController | null>(null);

  async function load({ markLoading = true }: { markLoading?: boolean } = {}) {
    activeRequestRef.current?.abort();
    const controller = new AbortController();
    activeRequestRef.current = controller;
    if (markLoading) setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/onchain", { signal: controller.signal });
      const data = await response.json();
      setPayload(data);
      if (!response.ok) setError(data?.endpoint?.issue?.message ?? "On-chain monitor could not load.");
    } catch (caught) {
      if (caught instanceof DOMException && caught.name === "AbortError") return;
      setError(caught instanceof Error ? caught.message : "On-chain monitor could not load.");
    } finally {
      if (activeRequestRef.current === controller) {
        activeRequestRef.current = null;
        setLoading(false);
      }
    }
  }

  async function refresh() {
    setLoading(true);
    await load({ markLoading: false });
  }

  useEffect(() => {
    const controller = new AbortController();
    activeRequestRef.current = controller;
    fetch("/api/onchain", { signal: controller.signal })
      .then(async (response) => {
        const data = await response.json();
        return { data, ok: response.ok };
      })
      .then((data) => {
        if (controller.signal.aborted) return;
        setPayload(data.data);
        setError(data.ok ? "" : data.data?.endpoint?.issue?.message ?? "On-chain monitor could not load.");
        setLoading(false);
      })
      .catch((caught) => {
        if (caught instanceof DOMException && caught.name === "AbortError") return;
        if (controller.signal.aborted) return;
        setError(caught instanceof Error ? caught.message : "On-chain monitor could not load.");
        setLoading(false);
      });
    return () => {
      controller.abort();
    };
  }, []);

  if (!payload && !error) {
    return (
      <Surface>
        <div className="skeleton" />
        <div className="skeleton" />
      </Surface>
    );
  }

  if (!payload) {
    return (
      <Surface tone="error">
        <Badge tone="error" icon={<AlertCircle size={14} />}>
          DEX feed failed
        </Badge>
        <p>{error}</p>
      </Surface>
    );
  }

  return (
    <Surface>
      <div className="section-actions">
        <h2 className="section-title">DEX spot-pair monitor</h2>
        <Button icon={<RefreshCw size={16} />} onClick={() => void refresh()} state={loading ? "loading" : "idle"} variant="secondary">
          Refresh
        </Button>
      </div>
      <div className="badge-row">
        <Badge
          tone={payload.endpoint.ok ? "success" : "error"}
          icon={payload.endpoint.ok ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
        >
          {payload.endpoint.ok ? "Endpoint live" : "Endpoint unavailable"}
        </Badge>
        <Badge>{payload.pairs.length} pairs</Badge>
      </div>

      {!payload.endpoint.ok ? (
        <Surface tone="warning">
          <p>{payload.endpoint.issue.message}</p>
        </Surface>
      ) : null}
      {error && payload.endpoint.ok ? (
        <p className="helper" data-tone="error">
          {error}
        </p>
      ) : null}

      <div className="table-wrap">
        <table className="spec-sheet">
          <thead>
            <tr>
              <th>Pair</th>
              <th>Network</th>
              <th>Price</th>
              <th>24h volume</th>
              <th>Liquidity</th>
              <th>24h move</th>
            </tr>
          </thead>
          <tbody>
            {payload.pairs.length ? (
              payload.pairs.map((pair, index) => (
                <tr key={`${pair.pairAddress ?? pair.baseSymbol ?? "pair"}-${index}`}>
                  <td>
                    {pair.baseSymbol ?? "—"}/{pair.quoteSymbol ?? "—"}
                  </td>
                  <td>{pair.network ?? "—"}</td>
                  <td>{formatCurrency(pair.priceUsd)}</td>
                  <td>{compactNumber(pair.volume24h)}</td>
                  <td>{compactNumber(pair.liquidity)}</td>
                  <td>{formatPercent(pair.percentChange24h)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6}>No DEX rows returned by the current API plan.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Surface>
  );
}
