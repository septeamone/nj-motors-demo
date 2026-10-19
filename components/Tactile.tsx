"use client";

import { useEffect } from "react";

const TARGET = ".btn, .pill, [role='radio'], summary, button[aria-expanded]";

/** A press on a button gives a short buzz where the device can (Android). */
export function Tactile() {
  useEffect(() => {
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const onDown = (e: PointerEvent) => {
      if (calm || e.button !== 0 || !(e.target instanceof Element) || !e.target.closest(TARGET)) return;
      navigator.vibrate?.(10);
    };
    document.addEventListener("pointerdown", onDown, { passive: true });
    return () => document.removeEventListener("pointerdown", onDown);
  }, []);
  return null;
}
