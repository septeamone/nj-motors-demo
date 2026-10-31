"use client";

import { useMotionValueEvent, useReducedMotion, type MotionValue } from "motion/react";
import { useEffect, useRef } from "react";
import { asset } from "@/lib/asset";

/**
 * A rendered film played by a progress value (0 → 1, from the scroll): the frames of the clip follow it, forwards
 * and back. The frames are pictures drawn on a canvas (seeking a video by scroll stutters, on iPhones most of all);
 * phones load their own vertical cut. The frames load only when the film gets near, the first one right away.
 *
 * Smoothness: between two frames of the clip the next one is blended in by how far the scroll has got, so the
 * picture flows instead of stepping. The frames are kept as small compressed files and only the ones around the
 * current position are unpacked in the background (createImageBitmap), so a frame never has to be unpacked at the
 * moment it is shown and a phone never holds the whole film unpacked in memory.
 */
export function FilmCanvas({ name, count, progress: p, className = "" }: { name: string; count: number; progress: MotionValue<number>; className?: string }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const files = useRef<(Blob | undefined)[]>([]);
  const bitmaps = useRef(new Map<number, ImageBitmap | "pending">());
  const shown = useRef(-1);
  const calm = useReducedMotion();
  // frames unpacked on each side of the current one (phones keep fewer: less decoding at a time, less memory)
  const AHEAD = typeof window !== "undefined" && innerWidth < 768 ? 6 : 10;
  // reduced motion: the film stands still on its last frame
  const at = (v: number) => (calm ? count - 1 : Math.min(count - 1, Math.max(0, v * (count - 1))));

  // unpack the frames around the current one, let go of the far ones
  const keep = (center: number) => {
    const map = bitmaps.current;
    for (let i = Math.max(0, center - AHEAD); i <= Math.min(count - 1, center + AHEAD); i++) {
      const f = files.current[i];
      if (!f || map.has(i)) continue;
      map.set(i, "pending");
      createImageBitmap(f).then(
        (bm) => {
          if (map.get(i) !== "pending") return bm.close();
          map.set(i, bm);
          if (Math.abs(i - at(p.get())) < 2) {
            shown.current = -1;
            draw(p.get());
          }
        },
        () => map.delete(i),
      );
    }
    for (const [i, bm] of map) {
      if (Math.abs(i - center) <= AHEAD + 4) continue;
      if (bm !== "pending") bm.close();
      map.delete(i);
    }
  };

  const draw = (v: number) => {
    const c = canvas.current;
    if (!c) return;
    const x = at(v);
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

  useMotionValueEvent(p, "change", draw);

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
      draw(p.get());
    };
    const fetchFrame = async (i: number) => {
      if (files.current[i]) return;
      const r = await fetch(`${dir}/${String(i + 1).padStart(3, "0")}.webp`);
      if (!r.ok || !alive) return;
      files.current[i] = await r.blob();
      if (Math.abs(i - at(p.get())) <= AHEAD) {
        shown.current = -1;
        draw(p.get());
      }
    };
    // all frames, a few at a time, starting from where the scroll is
    const fetchAll = async () => {
      const from0 = Math.floor(at(p.get()));
      const order = Array.from({ length: count }, (_, i) => i).sort((a, b) => Math.abs(a - from0) - Math.abs(b - from0));
      const next = () => order.shift();
      await Promise.all(
        Array.from({ length: small ? 3 : 6 }, async () => {
          for (let i = next(); i !== undefined && alive; i = next()) await fetchFrame(i).catch(() => {});
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
      { rootMargin: "150% 0px" },
    );
    // once the page itself has loaded: the hero film then downloads while the intro is still on screen, so the
    // first scroll does not have to fetch and unpack at the same moment (a film further down waits for its margin)
    const start = () => io.observe(c);
    if (document.readyState === "complete") start();
    else window.addEventListener("load", start, { once: true });
    return () => {
      alive = false;
      ro.disconnect();
      io.disconnect();
      window.removeEventListener("load", start);
      for (const bm of map.values()) if (bm !== "pending") bm.close();
      map.clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [calm, name, count]);

  return <canvas ref={canvas} aria-hidden className={`block size-full ${className}`} />;
}
