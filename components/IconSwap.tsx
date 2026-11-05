"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";

/**
 * An icon that changes with a state (play and pause, copy and copied, sun and moon) cross-fades: the old one shrinks
 * away blurred while the new one grows in. Nothing animates on first render; under reduced motion only the fade is left.
 */
export function IconSwap({ id, children, className = "" }: { id: string; children: React.ReactNode; className?: string }) {
  const calm = useReducedMotion();
  const away = { opacity: 0, scale: 0.25, filter: calm ? "blur(0px)" : "blur(4px)" };
  return (
    <AnimatePresence initial={false} mode="popLayout">
      <motion.span
        key={id}
        initial={away}
        animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
        exit={away}
        transition={{ type: "spring", duration: 0.3, bounce: 0 }}
        className={`grid place-items-center ${className}`}
      >
        {children}
      </motion.span>
    </AnimatePresence>
  );
}
