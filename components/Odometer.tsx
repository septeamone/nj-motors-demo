"use client";

import { useReducedMotion } from "motion/react";

const DIGITS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

/** One digit: a column 0-9 that slides to its value (a mechanical counter), so the number rolls instead of flashing. */
function Wheel({ d, i, calm }: { d: number; i: number; calm: boolean }) {
  return (
    <span className="odo-wheel" aria-hidden>
      <span className="odo-col" style={{ transform: `translateY(${-d}em)`, transitionDuration: calm ? "0s" : `${0.75 + (i % 4) * 0.08}s` }}>
        {DIGITS.map((n) => (
          <span key={n}>{n}</span>
        ))}
      </span>
    </span>
  );
}

/** A number as a row of rolling digits; spaces and signs stay still. The real text is in aria-label. */
export function Odometer({ text, label }: { text: string; label?: string }) {
  const calm = !!useReducedMotion();
  return (
    <span role="text" aria-label={label ?? text} className="odo">
      {[...text].map((c, i) => (c >= "0" && c <= "9" ? <Wheel key={`d${text.length - i}`} d={+c} i={i} calm={calm} /> : <span key={`s${text.length - i}`} aria-hidden className="odo-sep">{c === " " ? " " : c}</span>))}
    </span>
  );
}
