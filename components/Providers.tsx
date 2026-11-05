"use client";

import Lenis from "lenis";
import { MotionConfig } from "motion/react";
import { useEffect } from "react";
import { Tactile } from "./Tactile";

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const lenis = new Lenis({ autoRaf: true, anchors: { offset: -88 } });
    // the hero intro holds the scroll until the emblem has landed
    if (document.documentElement.dataset.intro === "play") lenis.stop();
    const release = () => lenis.start();
    window.addEventListener("intro-end", release);
    return () => {
      window.removeEventListener("intro-end", release);
      lenis.destroy();
    };
  }, []);

  // reduced motion: motion drops transform and layout animations everywhere and keeps the fades
  return (
    <MotionConfig reducedMotion="user">
      <Tactile />
      {children}
    </MotionConfig>
  );
}
