"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

import type { HistoricalTwin } from "@/lib/types";
import { dateOnly } from "@/lib/utils";

export function TwinChart({ twins }: { twins: HistoricalTwin[] }) {
  const data = twins.map((twin) => ({
    date: dateOnly(twin.date),
    similarity: Number(twin.similarity.toFixed(1)),
    return14d: twin.returns.fourteenDay
  }));

  if (data.length === 0) {
    return (
      <div className="chart-box surface" data-tone="muted">
        <p className="caption">The analog chart appears after historical CMC data is available.</p>
      </div>
    );
  }

  return (
    <div className="chart-box" aria-label="Historical twin similarity and 14 day returns">
      <ResponsiveContainer width="100%" height={288}>
        <BarChart data={data} margin={{ top: 12, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid stroke="var(--color-rule)" vertical={false} />
          <XAxis dataKey="date" tick={{ fill: "var(--color-muted)", fontSize: 12 }} tickLine={false} />
          <YAxis tick={{ fill: "var(--color-muted)", fontSize: 12 }} tickLine={false} />
          <Tooltip
            contentStyle={{
              background: "var(--color-surface)",
              border: "1px solid var(--color-rule)",
              borderRadius: "8px",
              color: "var(--color-ink)"
            }}
          />
          <Bar dataKey="similarity" fill="var(--color-ink)" radius={[6, 6, 0, 0]} name="Similarity" />
          <Bar dataKey="return14d" fill="var(--color-accent)" radius={[6, 6, 0, 0]} name="14d return" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
