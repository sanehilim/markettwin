import type { Metadata } from "next";
import { KeyRound, Server, ShieldCheck } from "lucide-react";
import type { CSSProperties } from "react";

import { Surface } from "@/components/ui/surface";

export const metadata: Metadata = {
  title: "Settings",
  description: "Review MarketTwin AI runtime configuration, provider keys, and production checks.",
  alternates: {
    canonical: "/settings"
  }
};

export default function SettingsPage() {
  return (
    <div className="page">
      <section className="hero-copy reveal" style={{ "--i": 0 } as CSSProperties}>
        <h1 className="page-title">Runtime settings</h1>
        <p className="lede">
          Keep keys server-side, check endpoint coverage, and tune the explanation model without changing the UI.
        </p>
      </section>

      <div className="panel-grid" data-cols="3">
        <Surface>
          <KeyRound size={22} />
          <h2 className="section-title">Secrets</h2>
          <p>
            Store CMC and OpenAI keys in `.env.local`. They are read only by server routes and are excluded from source
            control. Rotate keys immediately after any accidental exposure.
          </p>
        </Surface>
        <Surface>
          <Server size={22} />
          <h2 className="section-title">CMC base URL</h2>
          <p>
            `CMC_BASE_URL` defaults to the CMC Pro API host. Change it only when using a compatible gateway or proxy.
          </p>
        </Surface>
        <Surface>
          <ShieldCheck size={22} />
          <h2 className="section-title">Model control</h2>
          <p>
            `OPENAI_MODEL` controls explanation generation. The engine still returns deterministic reports if the LLM
            request fails.
          </p>
        </Surface>
      </div>

      <Surface>
        <h2 className="section-title">Production checks</h2>
        <div className="table-wrap">
          <table className="spec-sheet">
            <tbody>
              <tr>
                <th>Environment</th>
                <td>Use `.env.local` locally and platform secrets in production.</td>
              </tr>
              <tr>
                <th>Data coverage</th>
                <td>Open `/api-health` before research sessions to confirm historical quote access for the CMC plan.</td>
              </tr>
              <tr>
                <th>Financial safety</th>
                <td>Reports are research context and avoid trade instructions.</td>
              </tr>
              <tr>
                <th>Fallbacks</th>
                <td>Endpoint gaps are displayed in the UI instead of being replaced with invented values.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Surface>
    </div>
  );
}
