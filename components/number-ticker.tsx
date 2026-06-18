"use client";

import { useEffect, useMemo, useRef, useState } from "react";

export function NumberTicker({
  value,
  formatter,
  duration = 420
}: {
  value: number | null | undefined;
  formatter: (value: number | null | undefined) => string;
  duration?: number;
}) {
  const [display, setDisplay] = useState(value ?? 0);
  const displayRef = useRef(value ?? 0);
  const prefersReducedMotion = useMemo(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    []
  );

  useEffect(() => {
    if (value === null || value === undefined || !Number.isFinite(value)) return;
    if (prefersReducedMotion) {
      const frame = requestAnimationFrame(() => {
        displayRef.current = value;
        setDisplay(value);
      });
      return () => cancelAnimationFrame(frame);
    }

    const start = performance.now();
    const initial = displayRef.current;
    let frame = 0;

    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      const nextDisplay = initial + (value - initial) * eased;
      displayRef.current = nextDisplay;
      setDisplay(nextDisplay);
      if (progress < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [duration, prefersReducedMotion, value]);

  return <span aria-live="polite">{formatter(value === null || value === undefined ? value : display)}</span>;
}
