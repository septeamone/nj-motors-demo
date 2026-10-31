/**
 * What the opening loader waits for, and how far each part has got. The heavy parts report in (the hero film frame by
 * frame, the 3D phone once built, the fonts, the page itself); the loader ring shows the weighted sum as a real
 * percentage, not a looping animation.
 */
type Part = { weight: number; total: number; done: number };

const parts: Record<string, Part> = {
  page: { weight: 10, total: 1, done: 0 },
  fonts: { weight: 5, total: 1, done: 0 },
  film: { weight: 60, total: 0, done: 0 },
  phone: { weight: 25, total: 1, done: 0 },
};

/** How many steps a part has (the film: its frames). */
export function expect(key: keyof typeof parts, total: number) {
  parts[key].total = total;
}

/** One more step of a part is done. */
export function step(key: keyof typeof parts, n = 1) {
  const p = parts[key];
  p.done = Math.min(p.total || n, p.done + n);
}

/** A part is fully done (or will not happen on this device). */
export function finish(key: keyof typeof parts) {
  const p = parts[key];
  if (!p.total) p.total = 1;
  p.done = p.total;
}

/** 0 → 1: everything the first screens need has arrived. */
export function progress() {
  let sum = 0;
  let all = 0;
  for (const p of Object.values(parts)) {
    all += p.weight;
    sum += p.weight * (p.total ? p.done / p.total : 0);
  }
  return sum / all;
}
