"use client";

import { useEffect, useRef } from "react";

/** A headlight beam that follows the mouse (dark theme only, see .headlight): one composited layer, moved by transform. */
export function Headlight() {
  const beam = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = beam.current;
    if (!el || !matchMedia("(hover: hover) and (pointer: fine)").matches || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    let x = 0;
    let y = 0;
    const paint = () => {
      raf = 0;
      el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    };
    const move = (e: PointerEvent) => {
      x = e.clientX;
      y = e.clientY;
      el.style.setProperty("--on", "1");
      if (!raf) raf = requestAnimationFrame(paint);
    };
    const out = () => el.style.setProperty("--on", "0");
    window.addEventListener("pointermove", move, { passive: true });
    document.documentElement.addEventListener("pointerleave", out);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", move);
      document.documentElement.removeEventListener("pointerleave", out);
    };
  }, []);
  return <div ref={beam} aria-hidden className="headlight" />;
}
