"use client";

import { useMotionValueEvent, useReducedMotion, useScroll } from "motion/react";
import { useEffect, useRef } from "react";
import { asset } from "@/lib/asset";

/**
 * A rendered film played by the scroll: the section pins and the frames of the clip follow the scroll, forwards and
 * back. The frames are pictures drawn on a canvas (seeking a video by scroll stutters, on iPhones most of all);
 * phones load a smaller set. The frames load only when the film gets near, the first one right away.
 * The next section is pulled up over the last screen of the track, so it rises over the film's final frame.
 */
export function ScrollFilm({ name, count, from, to }: { name: string; count: number; from: string; to: string }) {
  const box = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const frames = useRef<HTMLImageElement[]>([]);
  const shown = useRef(-1);
  const calm = useReducedMotion();
  const { scrollYProgress: p } = useScroll({ target: box, offset: ["start start", "end end"] });

  // the film plays over the first part of the pinned scroll; the next section rises over the rest
  // (track 320svh, 220svh of it pinned; the next section starts rising 120svh in, at 120/220 ≈ 0.55)
  const PLAY = 0.54;

  const draw = (v: number) => {
    const c = canvas.current;
    if (!c) return;
    const want = Math.min(count - 1, Math.max(0, Math.round((v / PLAY) * (count - 1))));
    // the nearest frame that has arrived, so a fast scroll never shows an empty canvas
    let i = want;
    while (i > 0 && !frames.current[i]?.complete) i--;
    const img = frames.current[i];
    if (!img?.complete || !img.naturalWidth || i === shown.current) return;
    shown.current = i;
    const g = c.getContext("2d");
    if (!g) return;
    // cover the canvas like object-fit: cover
    const k = Math.max(c.width / img.naturalWidth, c.height / img.naturalHeight);
    const w = img.naturalWidth * k;
    const h = img.naturalHeight * k;
    g.drawImage(img, (c.width - w) / 2, (c.height - h) / 2, w, h);
  };

  useMotionValueEvent(p, "change", draw);

  useEffect(() => {
    const c = canvas.current;
    const b = box.current;
    if (!c || !b || calm) return;
    const small = innerWidth < 768;
    const dir = asset(`/films/${name}/${small ? "m" : "d"}`);
    const fit = () => {
      const dpr = Math.min(devicePixelRatio || 1, small ? 2 : 1.5);
      c.width = Math.round(c.clientWidth * dpr);
      c.height = Math.round(c.clientHeight * dpr);
      shown.current = -1;
      draw(p.get());
    };
    const load = (i: number) => {
      if (frames.current[i]) return;
      const img = new Image();
      img.decoding = "async";
      img.onload = () => {
        if (Math.abs(i - Math.round((p.get() / PLAY) * (count - 1))) < 3 || shown.current < 0) {
          shown.current = -1;
          draw(p.get());
        }
      };
      img.src = `${dir}/${String(i + 1).padStart(3, "0")}.webp`;
      frames.current[i] = img;
    };
    load(0);
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(c);
    const io = new IntersectionObserver(
      (e) => {
        if (!e[0].isIntersecting) return;
        io.disconnect();
        for (let i = 1; i < count; i++) load(i);
      },
      { rootMargin: "150% 0px" },
    );
    // not during the hero intro: it is busy loading the page, and the film is still far below
    const start = () => io.observe(b);
    if (document.documentElement.dataset.intro === "play") window.addEventListener("intro-end", start, { once: true });
    else start();
    return () => {
      ro.disconnect();
      io.disconnect();
      window.removeEventListener("intro-end", start);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [calm, name, count]);

  if (calm) return null;
  return (
    <div ref={box} aria-hidden className="relative mb-[-100svh] h-[320svh]" style={{ background: from }}>
      <div className="sticky top-0 h-svh overflow-hidden">
        <canvas ref={canvas} className="block size-full" />
        {/* the edges of the film melt into the page */}
        <span className="pointer-events-none absolute inset-0" style={{ boxShadow: `inset 0 0 18vmin 6vmin ${to}` }} />
      </div>
    </div>
  );
}
