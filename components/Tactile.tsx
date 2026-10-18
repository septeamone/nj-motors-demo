"use client";

import { useEffect } from "react";

const TARGET = ".btn, .pill, [role='radio'], summary, [data-state] > button";

/** A press on a button leaves a red NJ stamp under the finger and gives a short buzz where the device can (Android). */
export function Tactile() {
  useEffect(() => {
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const onDown = (e: PointerEvent) => {
      if (e.button !== 0 || !(e.target instanceof Element) || !e.target.closest(TARGET)) return;
      navigator.vibrate?.(10);
      if (calm) return;
      const s = document.createElement("span");
      s.setAttribute("aria-hidden", "true");
      s.textContent = "NJ";
      const turn = (Math.random() * 18 - 9).toFixed(1);
      s.style.cssText = `position:fixed;left:${e.clientX}px;top:${e.clientY}px;z-index:95;pointer-events:none;translate:-50% -50%;` +
        "display:grid;place-items:center;width:54px;height:54px;border:3px solid var(--accent);border-radius:5px;" +
        "color:var(--accent);font:400 19px/1 var(--font-russo),sans-serif;letter-spacing:.04em;";
      document.body.appendChild(s);
      s.animate(
        [
          { opacity: 0, scale: 1.9, rotate: `${Number(turn) - 16}deg` },
          { opacity: 0.95, scale: 1, rotate: `${turn}deg`, offset: 0.22 },
          { opacity: 0.95, scale: 1, rotate: `${turn}deg`, offset: 0.7 },
          { opacity: 0, scale: 1, rotate: `${turn}deg` },
        ],
        { duration: 760, easing: "cubic-bezier(0.16, 1, 0.3, 1)" },
      ).onfinish = () => s.remove();
    };
    document.addEventListener("pointerdown", onDown, { passive: true });
    return () => document.removeEventListener("pointerdown", onDown);
  }, []);
  return null;
}
