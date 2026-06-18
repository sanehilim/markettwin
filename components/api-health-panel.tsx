"use client";

import { AlertCircle, CheckCircle2, RefreshCw } from "lucide-react";
import { type FormEvent, useEffect, useRef, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Surface } from "@/components/ui/surface";

type HealthPayload = {
  generatedAt: string;
  secrets: {
    coinmarketcap: boolean;
    openai: boolean;
  };
  endpoints: Array<{
    ok: boolean;
    endpoint: string;
    label: string;
    updatedAt: string;
    credits?: number;
    issue?: {
      message: string;
      statusCode?: number;
      recoverable: boolean;
    };
  }>;
  openai: {
    ok: boolean;
    label: string;
    message: string;
  };
};

export function ApiHealthPanel() {
  const [payload, setPayload] = useState<HealthPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [adminToken, setAdminToken] = useState(() =>
    typeof window === "undefined" ? "" : (window.sessionStorage.getItem("markettwin-health-token") ?? "")
  );
  const activeRequestRef = useRef<AbortController | null>(null);

  async function load({ markLoading = true, token = adminToken }: { markLoading?: boolean; token?: string } = {}) {
    activeRequestRef.current?.abort();
    const controller = new AbortController();
    activeRequestRef.current = controller;
    const trimmedToken = token.trim();
    if (markLoading) setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/health", {
        headers: trimmedToken ? { "x-admin-token": trimmedToken } : undefined,
        signal: controller.signal
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error ?? "API health could not load.");
      setPayload(data);
    } catch (caught) {
      if (caught instanceof DOMException && caught.name === "AbortError") return;
      setError(caught instanceof Error ? caught.message : "API health could not load.");
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

  async function submitToken(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    window.sessionStorage.setItem("markettwin-health-token", adminToken.trim());
    await load({ token: adminToken });
  }

  useEffect(() => {
    const controller = new AbortController();
    activeRequestRef.current = controller;
    const trimmedToken = adminToken.trim();

    fetch("/api/health", {
      headers: trimmedToken ? { "x-admin-token": trimmedToken } : undefined,
      signal: controller.signal
    })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data?.error ?? "API health could not load.");
        return data;
      })
      .then((data) => {
        if (controller.signal.aborted) return;
        setPayload(data);
        setError("");
        setLoading(false);
      })
      .catch((caught) => {
        if (caught instanceof DOMException && caught.name === "AbortError") return;
        if (controller.signal.aborted) return;
        setError(caught instanceof Error ? caught.message : "API health could not load.");
        setLoading(false);
      });

    return () => {
      controller.abort();
      if (activeRequestRef.current === controller) {
        activeRequestRef.current = null;
      }
    };
    // Run once on mount so a saved session token can unlock protected health checks.
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
          Health check failed
        </Badge>
        <p>{error}</p>
        <form className="token-form" onSubmit={(event) => void submitToken(event)}>
          <label className="field-label" htmlFor="health-admin-token">
            Admin token
          </label>
          <div className="token-row">
            <input
              autoComplete="off"
              className="input"
              data-transform="none"
              id="health-admin-token"
              onChange={(event) => setAdminToken(event.target.value)}
              type="password"
              value={adminToken}
            />
            <Button state={loading ? "loading" : "idle"} type="submit">
              Unlock
            </Button>
          </div>
        </form>
      </Surface>
    );
  }

  return (
    <div className="page-grid">
      <Surface>
        <div className="section-actions">
          <h2 className="section-title">Runtime keys</h2>
          <Button icon={<RefreshCw size={16} />} onClick={() => void refresh()} state={loading ? "loading" : "idle"} variant="secondary">
            Refresh
          </Button>
        </div>
        <div className="badge-row">
          <Badge tone={payload.secrets.coinmarketcap ? "success" : "error"}>
            CoinMarketCap {payload.secrets.coinmarketcap ? "configured" : "missing"}
          </Badge>
          <Badge tone={payload.secrets.openai ? "success" : "warning"}>
            OpenAI {payload.secrets.openai ? "configured" : "optional"}
          </Badge>
        </div>
        {error ? (
          <p className="helper" data-tone="error">
            {error}
          </p>
        ) : null}
        <p className="caption">{payload.openai.message}</p>
      </Surface>

      <Surface>
        <h2 className="section-title">Endpoint status</h2>
        <div className="table-wrap">
          <table className="spec-sheet">
            <thead>
              <tr>
                <th>Endpoint</th>
                <th>Status</th>
                <th>Credits</th>
                <th>Message</th>
              </tr>
            </thead>
            <tbody>
              {payload.endpoints.map((endpoint) => (
                <tr key={endpoint.endpoint}>
                  <td>{endpoint.label}</td>
                  <td>
                    <Badge
                      icon={endpoint.ok ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                      tone={endpoint.ok ? "success" : "error"}
                    >
                      {endpoint.ok ? "Live" : "Blocked"}
                    </Badge>
                  </td>
                  <td>{endpoint.credits ?? "—"}</td>
                  <td>{endpoint.ok ? endpoint.endpoint : endpoint.issue?.message ?? "No message returned."}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Surface>
    </div>
  );
}
