import { useState, useEffect, useRef, type MouseEvent, type RefObject } from "react";

/**
 * Smoothly animates a target number via requestAnimationFrame while respecting
 * prefers-reduced-motion so tabular financial KPIs settle cleanly on reveal or change.
 */
export function useCountUpNumber(target: number, durationMs: number = 650): number {
  const [displayValue, setDisplayValue] = useState<number>(target);
  const previousRef = useRef<number>(target);

  useEffect(() => {
    if (typeof window === "undefined") {
      setDisplayValue(target);
      return;
    }

    const prefersReduced =
      window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReduced || durationMs <= 0) {
      previousRef.current = target;
      setDisplayValue(target);
      return;
    }

    const startVal = previousRef.current;
    const diff = target - startVal;
    if (Math.abs(diff) < 0.01) {
      setDisplayValue(target);
      return;
    }

    let rafId: number;
    let startTime: number | null = null;

    const step = (ts: number) => {
      if (startTime === null) startTime = ts;
      const elapsed = ts - startTime;
      const progress = Math.min(1, elapsed / durationMs);
      // Smooth quintic ease-out curve matching cubic-bezier(0.16, 1, 0.3, 1) feel
      const eased = 1 - Math.pow(1 - progress, 4);
      const current = startVal + diff * eased;
      setDisplayValue(Math.round(current));

      if (progress < 1) {
        rafId = requestAnimationFrame(step);
      } else {
        previousRef.current = target;
        setDisplayValue(target);
      }
    };

    rafId = requestAnimationFrame(step);
    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      previousRef.current = target;
    };
  }, [target, durationMs]);

  return displayValue;
}

/**
 * Updates CSS variables (--neuro-x, --neuro-y) directly on a DOM container ref
 * for zero-rerender, compositor-friendly subtle light response under pointer movement.
 */
export function handleNeuroPointerMove(
  e: MouseEvent<HTMLElement>,
  containerRef: RefObject<HTMLElement | null>
) {
  const el = containerRef.current;
  if (!el) return;
  const rect = el.getBoundingClientRect();
  if (!rect.width || !rect.height) return;
  const xPct = Math.round(((e.clientX - rect.left) / rect.width) * 100);
  const yPct = Math.round(((e.clientY - rect.top) / rect.height) * 100);
  el.style.setProperty("--neuro-x", `${xPct}%`);
  el.style.setProperty("--neuro-y", `${yPct}%`);
}
