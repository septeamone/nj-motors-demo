"use client";

import { useMotionValueEvent, useReducedMotion, type MotionValue } from "motion/react";
import { useEffect, useRef } from "react";
import { asset } from "@/lib/asset";
import { expect, finish, step } from "@/lib/loading";
import { lightLoad } from "@/lib/net";

/**
 * A rendered film played by a progress value (0 → 1, from the scroll): the frames of the clip follow it, forwards
 * and back. The frames are pictures drawn on a canvas (seeking a video by scroll stutters, on iPhones most of all);
 * phones load their own vertical cut. The frames load in the background soon after the page (every 8th first, then
 * the ones between), so wherever the visitor arrives there is a frame close by; on a slow connection only when near.
 *
 * Smoothness: between two frames of the clip the next one is blended in by how far the scroll has got, so the
 * picture flows instead of stepping. The shown frame chases the scroll (quickly, never faster than CHASE frames per
 * frame of the screen), so a fast flick still plays the clip through instead of jumping to its end. The frames are kept as small compressed files and only the ones around the
 * current position are unpacked in the background (createImageBitmap), so a frame never has to be unpacked at the
 * moment it is shown and a phone never holds the whole film unpacked in memory.
 */
export function FilmCanvas({
  name,
  count,
  progress: p,
  className = "",
  preload = false,
}: {
  name: string;
  count: number;
  progress: MotionValue<number>;
  className?: string;
  /** the opening loader waits for the start of this film: fetch every frame at once (in order) and report the first
   * PRELOAD of them to lib/loading; the rest keep arriving while the visitor watches the first ones */
  preload?: boolean;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const files = useRef<(Blob | undefined)[]>([]);
  const bitmaps = useRef(new Map<number, ImageBitmap | "pending">());
  const shown = useRef(-1);
  const calm = useReducedMotion();
  // frames the opening loader waits for (a slow connection waits for fewer: the rest arrive while the visitor scrolls)
  const PRELOAD = typeof window !== "undefined" && lightLoad() ? 16 : 40;
  // frames unpacked on each side of the current one (phones keep fewer: less decoding at a time, less memory)
  const AHEAD = typeof window !== "undefined" && innerWidth < 768 ? 6 : 10;
  // reduced motion: the film stands still on its last frame
  const at = (v: number) => (calm ? count - 1 : Math.min(count - 1, Math.max(0, v * (count - 1))));
  // the frame on screen (it chases the target set by the scroll)
  const cur = useRef(-1);
  const target = useRef(0);
  const loop = useRef(0);
  const lastT = useRef(0);

  // unpack the frames around the current one, let go of the far ones
  const keep = (center: number) => {
    const map = bitmaps.current;
    // the nearest downloaded frame at or before the current one is always unpacked: early on, with only every 8th
    // frame there, it stands in until the ones around arrive
    let base = Math.min(count - 1, center);
    while (base > 0 && !files.current[base]) base--;
    const want = (i: number) => i === base || (i >= center - AHEAD && i <= center + AHEAD);
    for (const i of [base, ...Array.from({ length: 2 * AHEAD + 1 }, (_, k) => center - AHEAD + k)]) {
      if (i < 0 || i > count - 1) continue;
      const f = files.current[i];
      if (!f || map.has(i)) continue;
      map.set(i, "pending");
      createImageBitmap(f).then(
        (bm) => {
          if (map.get(i) !== "pending") return bm.close();
          map.set(i, bm);
          if (Math.abs(i - cur.current) < 2 || i === base) {
            shown.current = -1;
            render();
          }
        },
        () => map.delete(i),
      );
    }
    for (const [i, bm] of map) {
      if (want(i) || Math.abs(i - center) <= AHEAD + 4) continue;
      if (bm !== "pending") bm.close();
      map.delete(i);
    }
  };

  // draw the frame cur points at
  const render = () => {
    const c = canvas.current;
    if (!c || cur.current < 0) return;
    const x = cur.current;
    const i = Math.floor(x);
    keep(i);
    // redraw only when the picture really changes (a hundredth of a frame)
    const key = Math.round(x * 100);
    if (key === shown.current) return;
    const map = bitmaps.current;
    // the nearest unpacked frame at or before this point, so a fast scroll never shows an empty canvas
    let j = i;
    while (j > 0 && !(map.get(j) instanceof ImageBitmap)) j--;
    const a = map.get(j);
    if (!(a instanceof ImageBitmap)) return;
    shown.current = key;
    const g = c.getContext("2d");
    if (!g) return;
    // cover the canvas like object-fit: cover
    const k = Math.max(c.width / a.width, c.height / a.height);
    const w = a.width * k;
    const h = a.height * k;
    const dx = (c.width - w) / 2;
    const dy = (c.height - h) / 2;
    g.globalAlpha = 1;
    g.drawImage(a, dx, dy, w, h);
    // the next frame laid over it by how far the scroll is between the two
    const b = map.get(j + 1);
    const t = j === i ? x - i : 0;
    if (t > 0.02 && b instanceof ImageBitmap) {
      g.globalAlpha = t;
      g.drawImage(b, dx, dy, w, h);
      g.globalAlpha = 1;
    }
  };

  // the shown frame runs after the scroll: close behind it while scrolling, and through every frame after a flick
  const CHASE = 1.6;
  const tick = (now: number) => {
    loop.current = 0;
    const dt = Math.min(64, now - (lastT.current || now - 16.7)) / 16.7;
    lastT.current = now;
    const d = target.current - cur.current;
    const stepBy = Math.max(-CHASE * dt, Math.min(CHASE * dt, d * (1 - Math.pow(0.7, dt))));
    cur.current = Math.abs(d) < 0.01 ? target.current : cur.current + stepBy;
    render();
    if (cur.current !== target.current) loop.current = requestAnimationFrame(tick);
  };
  const follow = (v: number) => {
    target.current = at(v);
    if (cur.current < 0) {
      cur.current = target.current;
      render();
      return;
    }
    if (!loop.current) {
      lastT.current = 0;
      loop.current = requestAnimationFrame(tick);
    }
  };
  useMotionValueEvent(p, "change", follow);

  useEffect(() => {
    const c = canvas.current;
    if (!c) return;
    const small = innerWidth < 768;
    const dir = asset(`/films/${name}/${small ? "m" : "d"}`);
    const map = bitmaps.current;
    let alive = true;
    const fit = () => {
      const dpr = Math.min(devicePixelRatio || 1, 1.5);
      c.width = Math.round(c.clientWidth * dpr);
      c.height = Math.round(c.clientHeight * dpr);
      shown.current = -1;
      if (cur.current < 0) cur.current = at(p.get());
      render();
    };
    const asked = new Set<number>(); // each frame is fetched once, even when two loaders ask for it
    const fetchFrame = async (i: number) => {
      if (files.current[i] || asked.has(i)) return;
      asked.add(i);
      const r = await fetch(`${dir}/${String(i + 1).padStart(3, "0")}.webp`);
      if (!r.ok || !alive) return;
      files.current[i] = await r.blob();
      if (preload && i < PRELOAD) step("film");
      if (Math.abs(i - cur.current) <= AHEAD || i <= cur.current) {
        shown.current = -1;
        render();
      }
    };
    // all frames, a few at a time: the hero film in order from where the scroll is; the others coarse to fine
    // (every 8th frame, then every 4th, 2nd, the rest), so any point of the clip soon has a frame close by
    const fetchAll = async () => {
      const from0 = Math.floor(at(p.get()));
      const level = (i: number) => (preload ? 0 : i % 8 === 0 ? 0 : i % 4 === 0 ? 1 : i % 2 === 0 ? 2 : 3);
      const order = Array.from({ length: count }, (_, i) => i).sort((a, b) => level(a) - level(b) || Math.abs(a - from0) - Math.abs(b - from0));
      const next = () => order.shift();
      await Promise.all(
        Array.from({ length: small ? 3 : 6 }, async () => {
          for (let i = next(); i !== undefined && alive; i = next())
            await fetchFrame(i).catch(() => {
              if (preload && i < PRELOAD) step("film"); // a frame that failed must not hold the loader
            });
        }),
      );
    };
    void fetchFrame(calm ? count - 1 : 0);
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(c);
    const io = new IntersectionObserver(
      (e) => {
        if (!e[0].isIntersecting) return;
        io.disconnect();
        if (!calm) void fetchAll();
      },
      { rootMargin: "300% 0px" },
    );
    // once the page itself has loaded (and a moment after, so the first screen keeps the network): a film further
    // down downloads in the background; on a slow connection it waits until it is three screens away
    let later = 0;
    const start = () => {
      if (lightLoad()) io.observe(c);
      else later = window.setTimeout(() => !calm && void fetchAll(), 1500);
    };
    if (preload && !calm) {
      // the opening loader counts these frames: start right away
      expect("film", Math.min(count, PRELOAD));
      void fetchAll();
    } else {
      if (preload) finish("film");
      if (document.readyState === "complete") start();
      else window.addEventListener("load", start, { once: true });
    }
    return () => {
      alive = false;
      ro.disconnect();
      io.disconnect();
      clearTimeout(later);
      cancelAnimationFrame(loop.current);
      loop.current = 0;
      window.removeEventListener("load", start);
      for (const bm of map.values()) if (bm !== "pending") bm.close();
      map.clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [calm, name, count]);

  return <canvas ref={canvas} aria-hidden className={`block size-full ${className}`} />;
}
