"use client";

import { Pointer } from "lucide-react";
import { motion, useScroll, useTransform } from "motion/react";
import { useLayoutEffect, useRef } from "react";
import { asset } from "@/lib/asset";
import { EASE_CSS as EASE } from "@/lib/motion";
import { finish as partDone, progress } from "@/lib/loading";
import { slowNet } from "@/lib/net";
import { FilmCanvas } from "./FilmCanvas";

// Wheel discs cut from the logo itself (centres measured on the 1254px original), as fractions of the logo.
const WHEELS = [
  { f: "rear", left: "16.19%", top: "49.36%" },
  { f: "front", left: "74.72%", top: "49.28%" },
] as const;

// Scroll distance (in screen heights) over which the halves part and the emblem flies up into the header.
const PART = 0.5;
// The container standing behind the halves opens with the scroll (the film, made with Higgsfield): it starts while the
// halves are still parting (FILM_FROM) and runs over FILM screens, its last frames already under the catalog heading
// rising over it, so the film costs almost no scroll of its own. The section is 100svh + the pinned scroll
// (PART + HOLD) + 100svh pulled back by the negative margin.
const HOLD = 0.3;
const FILM_FROM = 0.25;
const FILM = 0.9;
// Intro scrub: how much wheel / swipe it takes to open the site (1 = the whole way)
const WHEEL_PER_PX = 1 / 650;
const AUTO_AFTER_MS = 3000;
// any small gesture opens the site: past this share of the scrub it completes by itself
const OPEN_AT = 0.06;

// The opening loader waits until everything the first screens need has arrived (lib/loading), but never longer than
// this from the moment the loader appears: then the site opens and the rest loads while the visitor scrolls.
const LOAD_LIMIT_MS = 5000;
const RING = 2 * Math.PI * 48; // circumference of the loader ring (r = 48 on a 100 × 100 drawing)

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
  const { scrollY: pageY } = useScroll();
  const at = (v: number, from: number, len: number) =>
    typeof window === "undefined" ? 0 : Math.min(1, Math.max(0, (v - from * innerHeight) / (len * innerHeight)));
  const film = useTransform(pageY, (v) => at(v, FILM_FROM, FILM));
  // the film never just stops: when the clip is over the camera keeps creeping in, and the picture settles into
  // shade as the catalog rises over it (scroll-linked, so linear: the scroll is the easing)
  const push = useTransform(pageY, (v) => `scale(${1 + 0.14 * at(v, FILM_FROM + FILM - 0.15, 1.5)})`);
  const shade = useTransform(pageY, (v) => 0.6 * at(v, FILM_FROM + FILM - 0.1, 1.1));
  const stage = useRef<HTMLDivElement>(null);
  const slot = useRef<HTMLDivElement>(null);
  const emblem = useRef<HTMLAnchorElement>(null);
  const textHalf = useRef<HTMLDivElement>(null);
  const artHalf = useRef<HTMLDivElement>(null);
  const hint = useRef<HTMLButtonElement>(null);
  const echo = useRef<HTMLDivElement>(null);
  const loader = useRef<HTMLDivElement>(null);
  const ring = useRef<SVGCircleElement>(null);
  const percent = useRef<HTMLSpanElement>(null);

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
    let lastE = -1;
    const update = () => {
      raf = 0;
      const e = smooth(clamp(scrollY / (innerHeight * PART)));
      // below the hero nothing changes any more: skip the writes (they made every scroll frame lay the page out again)
      if (e === lastE) return;
      lastE = e;
      const pageW = html.clientWidth; // read before the writes below, so the browser does not lay out twice
      // written straight onto the two panels (a custom property on the stage would be inherited by the whole hero subtree)
      const lgNow = innerWidth >= 1024;
      tx.style.transform = lgNow ? `translateX(calc(${e} * (-100% - 8px)))` : `translateY(calc(${e} * (100% + 8px)))`;
      ar.style.transform = lgNow ? `translateX(calc(${e} * (100% + 8px)))` : `translateY(calc(${e} * (-100% - 8px)))`;
      const k = 1 + (endSize / s0 - 1) * e;
      const cx = slotCx + (pageW / 2 - slotCx) * e; // the middle of the page, not counting the scrollbar
      const cy = slotCy + (endTop + endSize / 2 - slotCy) * e;
      em.style.transform = pose(cx, cy, k);
    };
    const onScroll = () => {
      if (!raf && html.dataset.intro !== "play" && html.dataset.intro !== "glide") raf = requestAnimationFrame(update);
    };
    const onResize = () => {
      measure();
      lastE = -1;
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
    // the loader: the ring and the number follow the real progress of what the first screens need
    const ld = loader.current;
    document.fonts.ready.then(() => partDone("fonts"));
    if (document.readyState === "complete") partDone("page");
    else window.addEventListener("load", () => partDone("page"), { once: true });
    let loadTimer = 0;
    const loadStart = performance.now();
    let loadingDone = () => {};
    const allLoaded = new Promise<void>((r) => (loadingDone = r));
    const tickLoad = () => {
      const v = progress();
      if (ring.current) ring.current.style.strokeDashoffset = String(RING * (1 - v));
      if (percent.current) percent.current.textContent = `${Math.round(v * 100)}%`;
      if (v >= 0.999 || performance.now() - loadStart > (slowNet() ? LOAD_LIMIT_MS * 0.6 : LOAD_LIMIT_MS)) return loadingDone();
      loadTimer = window.setTimeout(tickLoad, 100);
    };
    tickLoad();

    if (calmMotion) {
      if (ld) ld.style.display = "none";
      delete html.dataset.intro;
      return () => {
        clearTimeout(loadTimer);
        cleanup();
      };
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
    // while loading the emblem stands a little smaller, inside the loader ring
    const fullK = (Math.min(innerWidth, innerHeight) * 0.66) / s0;
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
      if (echo.current) echo.current.style.opacity = g > 0 ? "0" : "";
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
      echo.current?.remove();
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
      // a short swipe or one wheel click is enough: the rest of the way runs by itself
      if (gt >= OPEN_AT) return goTo(1);
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
    // a tap on the emblem opens the site too (it is a link to the top, so the jump is held back while the intro is on)
    const onEmblem = (e: MouseEvent) => {
      if (finished) return;
      e.preventDefault();
      if (ready) goTo(1);
    };
    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("keydown", onKey);
    hi.addEventListener("click", onHint);
    em.addEventListener("click", onEmblem);
    detach = () => {
      em.removeEventListener("click", onEmblem);
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
        await allLoaded;
        // the ring closes, the loader steps back, and the invitation to scroll takes its place
        if (ld) {
          ld.style.opacity = "0";
          window.setTimeout(() => (ld.style.display = "none"), 500);
        }
        ready = true;
        hi.style.visibility = "visible";
        hi.style.opacity = "1";
        // soft rings go out from the emblem: it can be tapped
        const ec = echo.current;
        if (ec) {
          const d = s0 * full.k * 0.97;
          Object.assign(ec.style, { left: `${full.cx - d / 2}px`, top: `${full.cy - d / 2}px`, width: `${d}px`, height: `${d}px` });
          ec.dataset.on = "";
        }
        autoTimer = window.setTimeout(() => goTo(1), AUTO_AFTER_MS);
      },
      () => {},
    );

    return () => {
      detach();
      clearTimeout(loadTimer);
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
      <section id="top" className="relative -mb-[100svh] h-[280svh]">
        <div ref={stage} className="split-stage pointer-events-none sticky top-0 h-svh overflow-hidden">
          {/* behind the halves: the NJ Motors container, which opens as you scroll on */}
          <div aria-hidden className="hero-film absolute inset-0 overflow-hidden bg-[#05080c]">
            <motion.div style={{ transform: push }} className="absolute inset-0 will-change-transform">
              <FilmCanvas name="container" count={91} progress={film} preload />
            </motion.div>
            <span className="pointer-events-none absolute inset-0 shadow-[inset_0_0_18vmin_6vmin_#05080c]" />
            <motion.span style={{ opacity: shade }} className="pointer-events-none absolute inset-0 bg-[#05080c]" />
          </div>
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
        {/* phones take the 640 px emblem (74 KB instead of 237 KB): it is the first picture on screen */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={asset("/brand/nj-logo-full.webp")}
          srcSet={`${asset("/brand/nj-logo-640.webp")} 640w, ${asset("/brand/nj-logo-full.webp")} 1254w`}
          sizes="(min-width:1024px) 580px, 80vw"
          alt=""
          width={1254}
          height={1254}
          fetchPriority="high"
          className="emblem-img block size-full drop-shadow-[0_14px_22px_var(--shadow)]"
        />
        {WHEELS.map((w) => (
          <span key={w.f} aria-hidden className="wheel-spin absolute block aspect-square w-[10.2%]" style={{ left: w.left, top: w.top }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={asset(`/brand/nj-wheel-${w.f}.webp`)} alt="" width={128} height={128} className="block size-full" />
          </span>
        ))}
      </a>

      {/* echo rings round the emblem once the site is loaded: tap it or swipe to open */}
      <div ref={echo} aria-hidden className="intro-echo pointer-events-none fixed z-[54]">
        <span />
        <span />
      </div>

      {/* the opening loader: a ring round the emblem filling with the real progress, and the number under it */}
      <div ref={loader} aria-hidden className="intro-loader pointer-events-none fixed inset-0 z-[54] transition-opacity duration-500">
        <svg viewBox="0 0 100 100" className="absolute top-1/2 left-1/2 size-[min(78vw,74svh)] -translate-x-1/2 -translate-y-1/2 -rotate-90">
          <circle cx="50" cy="50" r="48" fill="none" stroke="var(--line-strong)" strokeWidth="0.8" />
          <circle
            ref={ring}
            cx="50"
            cy="50"
            r="48"
            fill="none"
            stroke="var(--accent)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray={RING}
            strokeDashoffset={RING}
            className="transition-[stroke-dashoffset] duration-300 ease-out"
          />
        </svg>
        <p className="absolute inset-x-0 bottom-[max(3svh,20px)] flex flex-col items-center gap-1 text-ink">
          <span className="text-[16px] font-semibold text-ink">Загружаем сайт</span>
          <span ref={percent} className="num text-[clamp(30px,4vw,44px)] leading-none">
            0%
          </span>
        </p>
      </div>

      <button
        ref={hint}
        type="button"
        style={{ visibility: "hidden", opacity: 0 }}
        className="intro-hint fixed bottom-6 left-1/2 z-[56] flex -translate-x-1/2 cursor-pointer flex-col items-center gap-2 rounded-[10px] bg-[var(--bg)]/85 px-5 py-3 text-ink transition-opacity duration-500"
      >
        {/* mouse: the wheel; touch screens: a finger swiping up */}
        <span className="text-[16px] font-bold pointer-coarse:hidden">Листайте</span>
        <span className="hidden text-[16px] font-bold pointer-coarse:inline">Проведите вверх</span>
        <span aria-hidden className="intro-hint-mouse relative block h-9 w-6 rounded-full border-2 border-current pointer-coarse:hidden">
          <i className="absolute top-1.5 left-1/2 block h-2 w-[3px] -translate-x-1/2 rounded-full bg-accent" />
        </span>
        <span aria-hidden className="intro-hint-swipe relative hidden h-11 w-8 pointer-coarse:block">
          <i className="absolute top-0 left-1/2 block h-full w-[3px] -translate-x-1/2 rounded-full bg-current opacity-25" />
          <Pointer className="intro-hint-finger absolute bottom-0 left-1/2 size-7 -translate-x-1/2 text-accent" strokeWidth={2.2} />
        </span>
      </button>
    </>
  );
}
