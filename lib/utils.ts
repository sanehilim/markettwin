import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function compactNumber(value: number | null | undefined, options?: Intl.NumberFormatOptions) {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 2,
    ...options
  }).format(value);
}

export function formatCurrency(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: value > 1000 ? 0 : 2
  }).format(value);
}

export function formatPercent(value: number | null | undefined, fractionDigits = 1) {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return `${value >= 0 ? "+" : ""}${value.toFixed(fractionDigits)}%`;
}

export function formatProbability(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return `${Math.round(value)}%`;
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function mean(values: number[]) {
  const filtered = values.filter((value) => Number.isFinite(value));
  if (filtered.length === 0) return null;
  return filtered.reduce((sum, value) => sum + value, 0) / filtered.length;
}

export function standardDeviation(values: number[]) {
  const avg = mean(values);
  if (avg === null) return null;
  const variance = mean(values.map((value) => (value - avg) ** 2));
  return variance === null ? null : Math.sqrt(variance);
}

export function sanitizeSymbol(symbol: string) {
  return symbol.trim().toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 12);
}

export function isoDate(input: string | number | Date) {
  const date =
    typeof input === "number"
      ? new Date(input * 1000)
      : input instanceof Date
        ? input
        : new Date(input);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString();
}

export function dateOnly(input: string) {
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return input;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(date);
}
