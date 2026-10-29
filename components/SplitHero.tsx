"use client";

import Image from "next/image";
import { useLayoutEffect, useRef } from "react";
import { asset } from "@/lib/asset";
import { EASE_CSS as EASE } from "@/lib/motion";
import { Markets } from "./Markets";

// Wheel discs cut from the logo itself (centres measured on the 1254px original), as fractions of the logo.
const WHEELS = [
  { f: "rear", left: "16.19%", top: "49.36%" },
  { f: "front", left: "74.72%", top: "49.28%" },
] as const;

// Scroll distance (in screen heights) over which the halves part and the emblem flies up into the header.
const PART = 0.65;
// Intro scrub: how much wheel / swipe it takes to open the site (1 = the whole way)
const WHEEL_PER_PX = 1 / 650;
const AUTO_AFTER_MS = 6000;

/** Resolves when fonts, the page and the 3D phone (PhoneMock sets window.__phoneReady) are ready, or after a safety limit. */
const loaded = () =>
  new Promise<void>((resolve) => {
    const w = window as unknown as { __phoneReady?: boolean };
    const done = () => document.readyState === "complete" && w.__phoneReady === true;
    const t0 = performance.now();
    const check = async () => {
      await document.fonts.ready;
      if (done() || performance.now() - t0 > 3000) return resolve();
      setTimeout(check, 120);
    };
    check();
  });

const smooth = (t: number) => t * t * (3 - 2 * t);
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));

/**
 * Hero as two clearly separate halves: text on one, the emblem on the other.
 * Intro: the emblem fills the screen and pulses until everything is loaded; then the visitor opens the site by scrolling
 * (wheel, swipe, arrow keys or a tap): the emblem glides into its half as the halves close in and the header drops down,
 * all scrubbed by that gesture. Left alone for a few seconds it opens by itself.
 * Scroll: the halves slide apart and the same emblem shrinks into the middle of the header, where it keeps spinning.
 * The emblem is one fixed element positioned from the scroll (outside the sticky stage so it can sit above the header).
 */
export function SplitHero({ children }: { children: React.ReactNode }) {
  const stage = useRef<HTMLDivElement>(null);
  const slot = useRef<HTMLDivElement>(null);
  const emblem = useRef<HTMLAnchorElement>(null);
  const textHalf = useRef<HTMLDivElement>(null);
  const artHalf = useRef<HTMLDivElement>(null);
  const hint = useRef<HTMLButtonElement>(null);

  useLayoutEffect(() => {
    const st = stage.current;
    const sl = slot.current;
    const em = emblem.current;
    const tx = textHalf.current;
    const ar = artHalf.current;
    const hi = hint.current;
    if (!st || !sl || !em || !tx || !ar || !hi) return;
    const html = document.documentElement;
    em.style.opacity = "1";

    const header = () => document.querySelector<HTMLElement>(".header-in");
    let s0 = 1;
    let slotCx = 0;
    let slotCy = 0;
    let endSize = 64;
    let endTop = 4;
    const pose = (cx: number, cy: number, k: number, deg = 0) =>
      `translate3d(${cx - s0 / 2}px, ${cy - s0 / 2}px, 0) scale(${k}) rotate(${deg}deg)`;

    const measure = () => {
      const sr = st.getBoundingClientRect();
      const r = sl.getBoundingClientRect();
      s0 = r.width;
      slotCx = r.left - sr.left + r.width / 2;
      slotCy = r.top - sr.top + r.height / 2;
      // the miniature in the header: as big as fits inside the bar (it never hangs over the content below), still
      // big enough to read as the logo and to show the wheels turning
      endSize = innerWidth >= 1024 ? 96 : innerWidth >= 640 ? 72 : 60;
      endTop = ((header()?.offsetHeight ?? 68) - endSize) / 2;
      em.style.width = em.style.height = `${s0}px`;
    };

    // wheels: a slow idle turn, plus the scroll speed (signed: down turns them forward, up turns them back)
    const wheels = [...em.querySelectorAll<HTMLElement>(".wheel-spin")];
    const calmMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let wheelAng = 0;
    let lastY = scrollY;
    let lastT = performance.now();
    let vs = 0;
    let wheelRaf = 0;
    const spin = (now: number) => {
      const dt = Math.min(64, now - lastT);
      lastT = now;
      const v = (scrollY - lastY) / Math.max(1, dt); // px per ms
      lastY = scrollY;
      vs += (clamp(v, -4, 4) - vs) * 0.18;
      wheelAng = (wheelAng + dt * (0.22 + vs * 1.1)) % 360;
      for (const w of wheels) w.style.transform = `rotate(${wheelAng}deg)`;
      wheelRaf = requestAnimationFrame(spin);
    };
    const startSpin = () => {
      if (calmMotion || wheelRaf) return;
      wheels.forEach((w) => (w.style.animation = "none"));
      lastT = performance.now();
      lastY = scrollY;
      wheelRaf = requestAnimationFrame(spin);
    };
    // during the intro the CSS animation (.wheel-spin) turns the wheels: it runs on the compositor, so the heavy
    // loading going on at the same time cannot make it stutter; after the intro the scroll takes over
    window.addEventListener("intro-end", startSpin, { once: true });

    // after the intro: scroll drives the parting of the halves and the flight into the header
    let raf = 0;
    const update = () => {
      raf = 0;
      const e = smooth(clamp(scrollY / (innerHeight * PART)));
      // written straight onto the two panels (a custom property on the stage would be inherited by the whole hero subtree)
      const lgNow = innerWidth >= 1024;
      tx.style.transform = lgNow ? `translateX(calc(${e} * (-100% - 8px)))` : `translateY(calc(${e} * (100% + 8px)))`;
      ar.style.transform = lgNow ? `translateX(calc(${e} * (100% + 8px)))` : `translateY(calc(${e} * (-100% - 8px)))`;
      const k = 1 + (endSize / s0 - 1) * e;
      const cx = slotCx + (html.clientWidth / 2 - slotCx) * e; // the middle of the page, not counting the scrollbar
      const cy = slotCy + (endTop + endSize / 2 - slotCy) * e;
      em.style.transform = pose(cx, cy, k);
    };
    const onScroll = () => {
      if (!raf && html.dataset.intro !== "play" && html.dataset.intro !== "glide") raf = requestAnimationFrame(update);
    };
    const onResize = () => {
      measure();
      if (html.dataset.intro !== "play" && html.dataset.intro !== "glide") update();
    };

    measure();
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);

    const anims: Animation[] = [];
    const cleanup = () => {
      anims.forEach((a) => a.cancel());
      cancelAnimationFrame(raf);
      cancelAnimationFrame(wheelRaf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      delete html.dataset.intro;
    };
    if (calmMotion) {
      delete html.dataset.intro;
      return cleanup;
    }

    html.dataset.intro = "play";
    // the browser may restore a scroll position or jump to a #anchor: during the intro the page stays at the top.
    // A link opened with a #anchor is followed once the intro is over; a page refresh forgets the anchor
    // (menu clicks leave one in the address, and after a refresh it threw the visitor down the page)
    const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
    const hash = nav?.type === "reload" ? "" : location.hash;
    if (nav?.type === "reload" && location.hash) history.replaceState(null, "", location.pathname + location.search);
    if ("scrollRestoration" in history) history.scrollRestoration = "manual";
    const hold = () => {
      if (html.dataset.intro !== "done" && scrollY !== 0) scrollTo(0, 0);
    };
    scrollTo(0, 0);
    window.addEventListener("scroll", hold);
    const holdTimer = window.setInterval(hold, 100);

    const lg = innerWidth >= 1024;
    const fullK = (Math.min(innerWidth, innerHeight) * 0.94) / s0;
    const full = { cx: innerWidth / 2, cy: innerHeight / 2, k: fullK };

    // ---- the scrub: g runs 0 → 1; everything that moves in the intro is a function of g ----
    let g = 0;
    let ready = false;
    let finished = false;
    let idle = 0;
    let autoTimer = 0;
    let pulse: Animation | undefined;

    const startPulse = () => {
      pulse?.cancel();
      pulse = em.animate(
        [
          { transform: pose(full.cx, full.cy, full.k), opacity: 1 },
          { transform: pose(full.cx, full.cy, full.k * 1.035), opacity: 0.86 },
        ],
        { duration: 900, easing: "ease-in-out", iterations: Infinity, direction: "alternate", fill: "both" },
      );
    };

    const apply = () => {
      const e = smooth(g);
      html.dataset.intro = g > 0 ? "glide" : "play";
      em.style.transform = pose(full.cx + (slotCx - full.cx) * e, full.cy + (slotCy - full.cy) * e, full.k + (1 - full.k) * e);
      tx.style.transform = lg ? `translateX(${(1 - e) * -100}%)` : `translateY(${(1 - e) * 100}%)`;
      ar.style.transform = lg ? `translateX(${(1 - e) * 100}%)` : `translateY(${(1 - e) * -100}%)`;
      const h = header();
      if (h) {
        const hv = clamp((g - 0.55) / 0.45);
        h.style.opacity = String(hv);
        h.style.transform = `translateY(${(1 - smooth(hv)) * -100}%)`;
      }
      hi.style.opacity = String(g > 0 ? 0 : 1);
    };

    let detach = () => {};
    const finish = () => {
      if (finished) return;
      finished = true;
      clearTimeout(autoTimer);
      clearTimeout(idle);
      cancelAnimationFrame(loop);
      pulse?.cancel();
      anims.forEach((a) => a.cancel());
      tx.style.transform = "";
      ar.style.transform = "";
      const h = header();
      if (h) {
        h.style.opacity = "";
        h.style.transform = "";
      }
      hi.style.display = "none";
      detach();
      window.removeEventListener("scroll", hold);
      window.clearInterval(holdTimer);
      html.dataset.intro = "done";
      update();
      window.dispatchEvent(new Event("intro-end"));
      if (hash.length > 1) document.getElementById(decodeURIComponent(hash.slice(1)))?.scrollIntoView();
    };

    // g chases the target gt a little every frame, so wheel clicks and swipes glide instead of jumping
    let gt = 0;
    let loop = 0;
    let frameT = 0;
    const frame = (now = performance.now()) => {
      loop = 0;
      if (finished) return;
      // 0.14 per frame at 60 Hz, the same speed on 120 Hz screens
      const k = 1 - Math.pow(1 - 0.14, Math.min(250, now - (frameT || now - 16.7)) / 16.7);
      frameT = now;
      const d = gt - g;
      g = Math.abs(d) < 0.0008 ? gt : g + d * k;
      apply();
      if (g >= 0.998 && gt >= 1) return finish();
      if (g === gt && gt === 0 && !pulse) startPulse();
      if (g !== gt) loop = requestAnimationFrame(frame);
    };
    const kick = () => {
      if (!loop && !finished) {
        frameT = 0;
        loop = requestAnimationFrame(frame);
      }
    };
    const goTo = (target: number) => {
      gt = target;
      if (gt > 0) {
        pulse?.cancel();
        pulse = undefined;
      }
      kick();
    };

    const nudge = (d: number) => {
      if (!ready || finished) return;
      clearTimeout(autoTimer);
      pulse?.cancel();
      pulse = undefined;
      gt = clamp(gt + d);
      kick();
      clearTimeout(idle);
      // gesture over: past a third of the way it completes by itself, otherwise the emblem returns
      idle = window.setTimeout(() => goTo(gt >= 0.33 ? 1 : 0), 380);
    };

    const onWheel = (e: WheelEvent) => {
      if (!finished) {
        e.preventDefault();
        nudge(e.deltaY * WHEEL_PER_PX);
      }
    };
    let ty = 0;
    const onTouchStart = (e: TouchEvent) => {
      ty = e.touches[0].clientY;
    };
    const onTouchMove = (e: TouchEvent) => {
      if (finished) return;
      e.preventDefault();
      const y = e.touches[0].clientY;
      nudge(((ty - y) / (innerHeight * 0.55)) * 1);
      ty = y;
    };
    const onKey = (e: KeyboardEvent) => {
      if (finished) return;
      if (["ArrowDown", "PageDown", " ", "Enter"].includes(e.key)) {
        e.preventDefault();
        if (ready) goTo(1);
      }
    };
    const onHint = () => {
      if (ready && !finished) goTo(1);
    };
    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("keydown", onKey);
    hi.addEventListener("click", onHint);
    detach = () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("keydown", onKey);
      hi.removeEventListener("click", onHint);
    };

    // the emblem comes in, pulses until everything is loaded, then waits for the visitor (or opens itself)
    em.style.transform = pose(full.cx, full.cy, full.k * 0.55, -24);
    const arrive = em.animate(
      [
        { transform: pose(full.cx, full.cy, full.k * 0.55, -24), opacity: 0 },
        { transform: pose(full.cx, full.cy, full.k), opacity: 1 },
      ],
      { duration: 1300, delay: 150, easing: EASE, fill: "both" },
    );
    anims.push(arrive);
    arrive.finished.then(
      async () => {
        // hand the emblem over from the entrance animation (which would pin it in place) to the pulse and the scrub
        em.style.transform = pose(full.cx, full.cy, full.k);
        em.style.opacity = "1";
        arrive.cancel();
        startPulse();
        await loaded();
        ready = true;
        hi.style.visibility = "visible";
        hi.style.opacity = "1";
        autoTimer = window.setTimeout(() => goTo(1), AUTO_AFTER_MS);
      },
      () => {},
    );

    return () => {
      detach();
      clearTimeout(autoTimer);
      clearTimeout(idle);
      cancelAnimationFrame(loop);
      window.removeEventListener("scroll", hold);
      window.clearInterval(holdTimer);
      cleanup();
    };
  }, []);

  return (
    <>
      <section id="top" className="relative -mb-[90svh] h-[165svh]">
        <div ref={stage} className="split-stage pointer-events-none sticky top-0 z-10 h-svh overflow-hidden">
          <Markets />
          <div ref={artHalf} aria-hidden className="split-panel split-art" />
          <div ref={textHalf} className="split-panel split-text grain">
            {children}
          </div>
          <div ref={slot} aria-hidden className="split-slot" />
        </div>
      </section>

      <a
        ref={emblem}
        href="#top"
        aria-label="NJ Motors — Cars from Korea, est. 2023"
        className="fixed top-0 left-0 z-[55] block opacity-0 will-change-transform"
      >
        <Image src={asset("/brand/nj-logo-full.webp")} alt="" width={1254} height={1254} sizes="(min-width:1024px) 580px, 60vw" priority className="emblem-img block size-full drop-shadow-[0_14px_22px_var(--shadow)]" />
        {WHEELS.map((w) => (
          <span key={w.f} aria-hidden className="wheel-spin absolute block aspect-square w-[10.2%]" style={{ left: w.left, top: w.top }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={asset(`/brand/nj-wheel-${w.f}.webp`)} alt="" width={128} height={128} className="block size-full" />
          </span>
        ))}
      </a>

      <button
        ref={hint}
        type="button"
        style={{ visibility: "hidden", opacity: 0 }}
        className="intro-hint fixed bottom-6 left-1/2 z-[56] flex -translate-x-1/2 cursor-pointer flex-col items-center gap-2 rounded-[10px] bg-[var(--bg)]/85 px-5 py-3 text-ink transition-opacity duration-500"
      >
        <span className="text-[16px] font-bold">Листайте</span>
        <span aria-hidden className="intro-hint-mouse relative block h-9 w-6 rounded-full border-2 border-current">
          <i className="absolute top-1.5 left-1/2 block h-2 w-[3px] -translate-x-1/2 rounded-full bg-accent" />
        </span>
      </button>
    </>
  );
}
