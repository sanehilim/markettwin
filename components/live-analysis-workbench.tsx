"use client";

import Link from "next/link";
import { AlertCircle, ArrowRight, CheckCircle2, CircleDollarSign, Database, Loader2 } from "lucide-react";
import type { CSSProperties } from "react";
import { FormEvent, useCallback, useEffect, useId, useMemo, useRef, useState } from "react";

import { TwinChart } from "@/components/twin-chart";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Surface } from "@/components/ui/surface";
import type { MarketTwinReport } from "@/lib/types";
import { dateOnly, formatCurrency, formatPercent, formatProbability } from "@/lib/utils";

type LoadState = "idle" | "loading" | "success" | "error";

export function LiveAnalysisWorkbench({
  initialSymbol = "BTC",
  autoRun = true,
  compact = false,
  hero = false
}: {
  initialSymbol?: string;
  autoRun?: boolean;
  compact?: boolean;
  hero?: boolean;
}) {
  const [symbol, setSymbol] = useState(initialSymbol);
  const [touched, setTouched] = useState(false);
  const [state, setState] = useState<LoadState>("idle");
  const [error, setError] = useState("");
  const [report, setReport] = useState<MarketTwinReport | null>(null);
  const fieldId = useId();
  const requestIdRef = useRef(0);
  const activeRequestRef = useRef<AbortController | null>(null);

  const invalid = touched && !/^[A-Za-z0-9]{2,12}$/.test(symbol.trim());

  const analyzeSymbol = useCallback(async (nextSymbol: string) => {
    const cleanSymbol = nextSymbol.trim().toUpperCase();
    if (!/^[A-Z0-9]{2,12}$/.test(cleanSymbol)) {
      setTouched(true);
      setError("Use a valid CMC symbol such as BTC, ETH, SOL, or BNB.");
      setState("error");
      return;
    }

    activeRequestRef.current?.abort();
    const requestId = requestIdRef.current + 1;
    const controller = new AbortController();
    requestIdRef.current = requestId;
    activeRequestRef.current = controller;

    setState("loading");
    setError("");

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol: cleanSymbol }),
        signal: controller.signal
      });
      const payload = await response.json();
      if (requestId !== requestIdRef.current) return;

      if (!response.ok) {
        throw new Error(payload?.error || "MarketTwin could not analyze this symbol.");
      }

      setReport(payload);
      setState("success");
    } catch (caught) {
      if (caught instanceof DOMException && caught.name === "AbortError") return;
      if (requestId !== requestIdRef.current) return;
      setState("error");
      setError(caught instanceof Error ? caught.message : "MarketTwin could not analyze this symbol.");
    } finally {
      if (requestId === requestIdRef.current) activeRequestRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!autoRun) return;
    const timer = window.setTimeout(() => {
      void analyzeSymbol(initialSymbol);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [analyzeSymbol, autoRun, initialSymbol]);

  useEffect(() => {
    return () => activeRequestRef.current?.abort();
  }, []);

  async function runAnalysis(nextSymbol = symbol) {
    await analyzeSymbol(nextSymbol);
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setTouched(true);
    void runAnalysis();
  }

  const endpointTone = useMemo(() => {
    const issues = report?.dataCoverage.issues.length ?? 0;
    if (issues === 0 && report) return "success";
    if (issues > 0 && report?.twins.length) return "warning";
    if (issues > 0) return "error";
    return undefined;
  }, [report]);

  return (
    <div className={hero ? "workbench-frame agent-workbench reveal" : "workbench-frame reveal"} style={{ "--i": 1 } as CSSProperties}>
      <form className="analysis-form" onSubmit={onSubmit}>
        <label className="field-label" htmlFor={fieldId}>
          Market symbol
        </label>
        <div className="field-row">
          <div>
            <input
              aria-describedby={`${fieldId}-helper`}
              aria-invalid={invalid || undefined}
              className="input"
              id={fieldId}
              maxLength={12}
              onBlur={() => setTouched(true)}
              onChange={(event) => setSymbol(event.target.value)}
              placeholder="BTC"
              value={symbol}
            />
            <p className="helper" data-tone={invalid ? "error" : undefined} id={`${fieldId}-helper`}>
              {invalid
                ? "That symbol is not valid. Use 2-12 letters or numbers."
                : hero
                  ? "Agent reads quotes, history, market regime, and sentiment before writing the brief."
                  : "Runs against CoinMarketCap quotes, historical data, global metrics, and sentiment."}
            </p>
          </div>
          <Button
            disabled={state === "loading"}
            icon={state === "loading" ? <Loader2 size={16} /> : <ArrowRight size={16} />}
            state={state === "loading" ? "loading" : state === "error" ? "error" : "idle"}
            type="submit"
          >
            {hero ? "Run agent" : "Analyze"}
          </Button>
        </div>
      </form>

      {state === "loading" ? (
        <div aria-live="polite">
          <LoadingWorkbench compact={hero} />
        </div>
      ) : null}
      {state === "error" && error ? (
        <Surface aria-live="assertive" role="alert" tone="error">
          <div className="badge-row">
            <Badge tone="error" icon={<AlertCircle size={14} />}>
              Analysis stopped
            </Badge>
          </div>
          <p>{error}</p>
        </Surface>
      ) : null}

      {report && hero ? <AgentHeroResult report={report} endpointTone={endpointTone} /> : null}

      {report && !hero ? (
        <>
          <div className="badge-row">
            <Badge tone="ink" icon={<CircleDollarSign size={14} />}>
              {report.asset?.symbol ?? report.symbol}
            </Badge>
            <Badge tone={endpointTone} icon={endpointTone === "success" ? <CheckCircle2 size={14} /> : <Database size={14} />}>
              {report.dataCoverage.historicalPoints} historical points
            </Badge>
            <Badge>{new Date(report.generatedAt).toLocaleString()}</Badge>
          </div>

          <div className="panel-grid" data-cols="3">
            <Surface tone="ink">
              <span className="metric-label">Current price</span>
              <strong className="metric-value">{formatCurrency(report.asset?.price)}</strong>
              <span className="caption">
                24h {formatPercent(report.asset?.percentChange24h)} · 7d {formatPercent(report.asset?.percentChange7d)}
              </span>
            </Surface>
            <Surface>
              <span className="metric-label">Bullish probability</span>
              <strong className="metric-value">{formatProbability(report.prediction.bullishProbability)}</strong>
              <span className="caption">Based on nearest historical twins only.</span>
            </Surface>
            <Surface>
              <span className="metric-label">Average 14d return</span>
              <strong className="metric-value">{formatPercent(report.prediction.averageReturn14d)}</strong>
              <span className="caption">
                Risk {report.prediction.riskLevel} · confidence {report.prediction.confidence}
              </span>
            </Surface>
          </div>

          {!compact ? (
            <div className="panel-grid" data-cols="2">
              <Surface>
                <h2 className="section-title">Explanation</h2>
                <p>{report.explanation}</p>
              </Surface>
              <Surface>
                <h2 className="section-title">Market fingerprint</h2>
                <div className="stat-strip">
                  <Metric label="RSI" value={report.features.rsi14?.toFixed(1) ?? "—"} />
                  <Metric label="Fear" value={report.features.fearGreed?.toFixed(0) ?? "—"} />
                  <Metric label="BTC dom." value={formatPercent(report.features.btcDominance, 1)} />
                  <Metric label="Volume ratio" value={report.features.volumeRatio30d?.toFixed(2) ?? "—"} />
                </div>
              </Surface>
            </div>
          ) : null}

          <Surface>
            <div className="section-actions">
              <h2 className="section-title">Nearest historical twins</h2>
              <Badge>{report.twins.length ? "Cosine similarity" : "Waiting for history"}</Badge>
            </div>
            <TwinChart twins={report.twins} />
            <div className="table-wrap">
              <table className="spec-sheet">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Similarity</th>
                    <th>14d return</th>
                    <th>Max drawdown</th>
                    <th>Regime</th>
                  </tr>
                </thead>
                <tbody>
                  {report.twins.length ? (
                    report.twins.map((twin) => (
                      <tr key={twin.date}>
                        <td>{dateOnly(twin.date)}</td>
                        <td>{twin.similarity.toFixed(1)}%</td>
                        <td>{formatPercent(twin.returns.fourteenDay)}</td>
                        <td>{formatPercent(twin.maxDrawdown14d)}</td>
                        <td>{twin.regime}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5}>Historical quotes are required before the twin table can be computed.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Surface>

          {!compact && report.dataCoverage.issues.length ? (
            <Surface tone="warning">
              <h2 className="section-title">Data notes</h2>
              <ul className="steps">
                {report.dataCoverage.issues.map((issue) => (
                  <li className="step" key={`${issue.endpoint}-${issue.message}`}>
                    <span className="stage">{issue.endpoint}</span>
                    <p>{issue.message}</p>
                  </li>
                ))}
              </ul>
            </Surface>
          ) : null}
        </>
      ) : null}
    </div>
  );
}

function AgentHeroResult({
  report,
  endpointTone
}: {
  report: MarketTwinReport;
  endpointTone: "success" | "warning" | "error" | undefined;
}) {
  const bestTwin = report.twins[0];
  const brief = bestTwin
    ? `${report.symbol} is closest to ${dateOnly(bestTwin.date)} at ${bestTwin.similarity.toFixed(
        1
      )}% similarity. The analog set shows ${formatPercent(
        report.prediction.averageReturn14d
      )} average 14d return with ${report.prediction.confidence.toLowerCase()} confidence.`
    : "The agent needs more historical coverage before it can rank reliable twins for this symbol.";

  return (
    <div className="agent-result">
      <div className="badge-row">
        <Badge tone="ink" icon={<CircleDollarSign size={14} />}>
          {report.asset?.symbol ?? report.symbol}
        </Badge>
        <Badge tone={endpointTone} icon={endpointTone === "success" ? <CheckCircle2 size={14} /> : <Database size={14} />}>
          {report.dataCoverage.historicalPoints} history points
        </Badge>
        <Badge>{new Date(report.generatedAt).toLocaleTimeString()}</Badge>
      </div>

      <div className="agent-metric-grid">
        <div className="agent-metric-card" data-tone="ink">
          <span className="metric-label">Current price</span>
          <strong className="metric-value">{formatCurrency(report.asset?.price)}</strong>
          <span className="caption">
            24h {formatPercent(report.asset?.percentChange24h)} / 7d {formatPercent(report.asset?.percentChange7d)}
          </span>
        </div>
        <div className="agent-metric-card">
          <span className="metric-label">Bullish probability</span>
          <strong className="metric-value">{formatProbability(report.prediction.bullishProbability)}</strong>
          <span className="caption">From nearest historical twins.</span>
        </div>
        <div className="agent-metric-card">
          <span className="metric-label">Best twin</span>
          <strong className="metric-value">{bestTwin ? `${bestTwin.similarity.toFixed(1)}%` : "-"}</strong>
          <span className="caption">{bestTwin ? dateOnly(bestTwin.date) : "Waiting for history"}</span>
        </div>
      </div>

      <div className="agent-brief">
        <span className="stage">Agent brief</span>
        <p>{brief}</p>
        <Link className="button" data-variant="secondary" href="/analyze">
          Inspect full report <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  );
}

function LoadingWorkbench({ compact = false }: { compact?: boolean }) {
  return (
    <div className={compact ? "agent-metric-grid" : "panel-grid"} data-cols={compact ? undefined : "3"} aria-live="polite" aria-busy="true">
      <div className="surface">
        <div className="skeleton" />
        <div className="skeleton" />
      </div>
      <div className="surface">
        <div className="skeleton" />
        <div className="skeleton" />
      </div>
      <div className="surface">
        <div className="skeleton" />
        <div className="skeleton" />
      </div>
    </div>
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
