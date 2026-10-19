"use client";

import { useEffect, useState } from "react";
import { formatCount, type CountKind } from "@/lib/format";

type CountUpProps = {
  value: number;
  kind: CountKind;
  durationMs?: number;
  delayMs?: number;
};

const easeOutCubic = (p: number) => 1 - (1 - p) ** 3;

/**
 * Chiffre qui défile de 0 à `value` après l'hydratation.
 * Le rendu serveur affiche directement la valeur finale ; les lecteurs d'écran ne lisent que celle-ci.
 */
export function CountUp({ value, kind, durationMs = 1100, delayMs = 250 }: CountUpProps) {
  const [displayed, setDisplayed] = useState(value);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame = 0;
    let start: number | null = null;
    const step = (now: number) => {
      start ??= now + delayMs;
      const progress = Math.min(1, Math.max(0, (now - start) / durationMs));
      setDisplayed(value * easeOutCubic(progress));
      if (progress < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [value, durationMs, delayMs]);

  return (
    <>
      <span aria-hidden="true" className="tabular-nums">
        {formatCount(displayed, kind)}
      </span>
      <span className="sr-only">{formatCount(value, kind)}</span>
    </>
  );
}
