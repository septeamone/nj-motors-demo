"use client";

import { Check } from "lucide-react";
import { AnimatePresence, motion, useMotionValueEvent, useScroll, useTransform, type MotionValue } from "motion/react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { asset } from "@/lib/asset";
import { DEAL_STAGES, STEPS } from "@/lib/data";
import { DUR, EASE } from "@/lib/motion";
import { nb } from "@/lib/typo";
import { NjIcon, type IconName } from "./NjIcon";

const N = STEPS.length;
// The payments made on each step (a step can carry two), from the step written on each payment in lib/data.ts
const PAYS = DEAL_STAGES.length;
const PAY_AT: Record<number, number[]> = {};
DEAL_STAGES.forEach((d, k) => (PAY_AT[d.step] ??= []).push(k));
const PAY_NOTE: Record<number, string> = { 0: "Платить пока не нужно", 3: "На этом этапе платить не нужно" };
const STEP_ICON: IconName[] = ["car", "inspect", "rub", "ship", "stamp", "truck"];
const PLACE = ["Корея", "Корея", "Корея", "Инчхон → Владивосток", "Владивосток", "Ваш город"];
const STOP_NAME = ["Подбор", "Проверка", "Выкуп", "Отправка", "Таможня", "Доставка"];

// The route across the top of the scene: one stop per step, on a 1000 × 120 drawing
const STOPS = [
  [40, 84],
  [220, 40],
  [400, 88],
  [590, 44],
  [780, 86],
  [960, 48],
];
const D = STOPS.reduce((d, [x, y], i) => {
  if (!i) return `M ${x} ${y}`;
  const [px, py] = STOPS[i - 1];
  const mx = (px + x) / 2;
  return `${d} C ${mx} ${py}, ${mx} ${y}, ${x} ${y}`;
}, "");

/**
 * One page of the process: the step's number, what happens and where, the step's points, and what you pay here.
 * The height follows the text (the desktop pad gives all its pages the same height).
 */
// `aligned`: the phone row lines all six cards up on one grid (subgrid), so headers, dashed lines and payment boxes sit at the same height
function Page({ i, className = "", aligned = false }: { i: number; className?: string; aligned?: boolean }) {
  const s = STEPS[i];
  const pays = PAY_AT[i] ?? [];
  const points = s.text.split(/(?<=[.;])\s+(?=[А-ЯЁA-Z])/);
  return (
    <article className={`relative ${aligned ? "row-span-2 grid grid-rows-subgrid" : "flex flex-col"} overflow-hidden rounded-[10px] bg-[var(--paper)] text-[var(--paper-ink)] shadow-[0_1px_0_rgba(18,16,13,0.18),0_22px_40px_-26px_var(--shadow)] ${className}`}>
      <header className="grid grid-cols-[auto_minmax(0,1fr)_auto] content-start gap-x-4 border-b-2 border-dashed border-[rgba(18,16,13,0.22)] px-5 pt-5 pb-4 lg:px-8 lg:pt-6">
        <span className={`num row-span-2 grid size-11 shrink-0 place-items-center rounded-full bg-[var(--accent-fill)] text-card text-white ${aligned ? "self-start" : "self-center"}`}>{i + 1}</span>
        <h3 className="col-start-2 self-center font-display text-[clamp(1.3125rem,2.2vw,1.6875rem)] leading-[1.1] tracking-title uppercase">{s.title}</h3>
        <NjIcon name={STEP_ICON[i]} className={`col-start-3 row-start-1 size-9 shrink-0 ${aligned ? "self-start max-[359px]:hidden" : "row-span-2 self-center"}`} />
        {/* on phones the place line may run under the icon, so "Инчхон → Владивосток" keeps to one line; under 360 px the small icon gives the title its room */}
        <p className={`col-start-2 mt-1.5 text-ui font-medium opacity-75 ${aligned ? "col-span-2" : ""}`}>{PLACE[i]}</p>
      </header>

      <div className="flex flex-1 flex-col gap-4 px-5 pt-4 pb-5 lg:gap-5 lg:px-8 lg:pb-6">
        <ul className="grid gap-2">
          {points.map((t) => (
            <li key={t} className="flex gap-2.5 text-body leading-body lg:text-body-lg">
              <Check aria-hidden className="mt-[3px] size-4 shrink-0 text-[var(--accent-fill)]" strokeWidth={2.5} nonScalingStroke />
              <span>{nb(t)}</span>
            </li>
          ))}
        </ul>

        <div className="mt-auto rounded-[4px] bg-[rgba(18,16,13,0.08)] px-4 py-3">
          {pays.length ? (
            <>
              <p className="text-small font-bold opacity-70">
                {pays.length > 1 ? `Платежи ${pays[0] + 1}–${pays.at(-1)! + 1}` : `Платёж ${pays[0] + 1}`} из {PAYS}
              </p>
              {pays.map((k) => (
                <div key={k} className="mt-1 [&+div]:mt-2 [&+div]:border-t [&+div]:border-[rgba(18,16,13,0.18)] [&+div]:pt-2">
                  <p className="text-body-lg leading-snug font-bold">{DEAL_STAGES[k].pay}</p>
                  {pays.length === 1 && <p className="mt-0.5 text-ui leading-body opacity-80">{DEAL_STAGES[k].when}</p>}
                </div>
              ))}
            </>
          ) : (
            <p className="text-body-lg font-bold">{PAY_NOTE[i]}</p>
          )}
        </div>
      </div>
    </article>
  );
}

/** The route over the scene: the red line is drawn as you scroll and the emblem drives along it, stop to stop. */
function RouteLine({ p, active }: { p: MotionValue<number>; active: number }) {
  const path = useRef<SVGPathElement>(null);
  const car = useRef<HTMLDivElement>(null);
  const box = useRef<HTMLDivElement>(null);
  // points along the path, the length drawn on screen up to each one (the stroke does not scale with the drawing, so
  // its dashes are measured in screen pixels), and the point where each stop sits
  const lut = useRef<{ pts: DOMPoint[]; cum: number[]; at: number[] }>(null);
  const SAMPLES = 480;

  const measure = () => {
    const el = path.current;
    const b = box.current;
    if (!el || !b) return;
    const len = el.getTotalLength();
    const sx = b.clientWidth / 1000;
    const sy = b.clientHeight / 120;
    const pts = Array.from({ length: SAMPLES + 1 }, (_, k) => el.getPointAtLength((len * k) / SAMPLES));
    const cum = [0];
    for (let k = 1; k <= SAMPLES; k++) cum.push(cum[k - 1] + Math.hypot((pts[k].x - pts[k - 1].x) * sx, (pts[k].y - pts[k - 1].y) * sy));
    const at = STOPS.map(([x, y]) => pts.reduce((best, q, k) => (Math.hypot(q.x - x, q.y - y) < Math.hypot(pts[best].x - x, pts[best].y - y) ? k : best), 0));
    lut.current = { pts, cum, at };
  };

  const draw = (v: number) => {
    const el = path.current;
    if (!el) return;
    if (!lut.current) measure();
    if (!lut.current) return;
    const { pts, cum, at } = lut.current;
    // the car rests at a stop while its page lies flat and drives to the next one while the page turns
    const seg = Math.min(N - 2, Math.max(0, Math.floor(v)));
    const f = Math.min(1, Math.max(0, (v - seg - 0.25) / 0.6));
    const j = Math.round(at[seg] + (at[seg + 1] - at[seg]) * (v >= N - 1 ? 1 : f));
    const total = cum[SAMPLES];
    el.style.strokeDasharray = `${total} ${total}`;
    el.style.strokeDashoffset = `${total - cum[j]}`;
    const pt = pts[j];
    const ahead = pts[Math.min(SAMPLES, j + 3)];
    const ang = j < SAMPLES - 3 ? (Math.atan2(ahead.y - pt.y, ahead.x - pt.x) * 180) / Math.PI : 0;
    if (car.current) car.current.style.transform = `translate(${pt.x / 10}cqw, ${(pt.y / 120) * 100}cqh) translate(-50%, -50%) rotate(${ang * 0.3}deg)`;
  };
  useMotionValueEvent(p, "change", draw);
  useEffect(() => {
    const ro = new ResizeObserver(() => {
      measure();
      draw(p.get());
    });
    if (box.current) ro.observe(box.current);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div ref={box} className="relative h-[120px] [container-type:size]" aria-hidden>
      <svg viewBox="0 0 1000 120" preserveAspectRatio="none" className="absolute inset-0 size-full overflow-visible">
        <path d={D} fill="none" stroke="var(--line-strong)" strokeWidth="2" strokeDasharray="3 9" vectorEffect="non-scaling-stroke" />
        <path ref={path} d={D} fill="none" stroke="var(--accent)" strokeWidth="4" strokeLinecap="round" vectorEffect="non-scaling-stroke" style={{ strokeDasharray: 3000, strokeDashoffset: 3000 }} />
      </svg>
      {STOPS.map(([x, y], i) => (
        <div key={i} className="absolute" style={{ left: `${x / 10}%`, top: `${(y / 120) * 100}%` }}>
          <span className={`absolute size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] transition-colors duration-700 ${i <= active ? "border-accent bg-accent" : "border-line-strong bg-bg-2"}`} />
          <span
            className={`absolute left-0 -translate-x-1/2 text-ui font-bold whitespace-nowrap transition-colors duration-700 ${y > 60 ? "top-7" : "bottom-7"} ${i <= active ? "text-ink" : "text-ink-3"}`}
          >
            {STOP_NAME[i]}
          </span>
        </div>
      ))}
      <div ref={car} className="absolute top-0 left-0 w-[52px]">
        <Image src={asset("/brand/nj-logo-640.webp")} alt="" width={160} height={160} className="block size-full" />
      </div>
    </div>
  );
}

/** The payments beside the pad: the ones due at this step are lit, the ones behind you are ticked. */
function Ledger({ active }: { active: number }) {
  const note = PAY_NOTE[active];
  return (
    <div>
      <h3 className="font-display text-[clamp(1.375rem,2vw,1.75rem)] leading-[1.1] tracking-title uppercase">Этапы оплаты</h3>
      <p className="mt-3 max-w-[34ch] text-body-lg leading-body text-ink-2">Все платежи официальные на имя покупателя.</p>
      <ol className="mt-6 flex flex-col gap-1.5">
        {DEAL_STAGES.map((d) => {
          const state = d.step < active ? "done" : d.step === active ? "now" : "next";
          return (
            <li
              key={d.pay}
              className={`flex gap-4 rounded-[6px] px-4 py-2.5 transition-[background-color,opacity] duration-700 ${state === "now" ? "bg-surface-2" : ""} ${state === "next" ? "opacity-50" : ""}`}
            >
              <span
                className={`mt-0.5 grid size-7 shrink-0 place-items-center rounded-full transition-colors duration-700 ${state === "next" ? "border-2 border-line-strong" : "bg-accent text-on-accent"}`}
              >
                {state === "done" && <Check className="size-4" strokeWidth={2.5} nonScalingStroke />}
              </span>
              <div className="min-w-0">
                <p className="text-body-lg leading-snug font-bold text-ink">{d.pay}</p>
                <p className="mt-0.5 max-w-[65ch] text-ui leading-body text-ink-2">{d.when}</p>
              </div>
            </li>
          );
        })}
      </ol>
      <div className="mt-4 h-7">
        <AnimatePresence mode="wait" initial={false}>
          {note && (
            <motion.p
              key={note}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6, transition: { duration: 0.2 } }}
              transition={{ duration: DUR, ease: EASE }}
              className="px-4 text-body-lg font-bold text-accent-ink"
            >
              Сейчас: {note.toLowerCase()}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/** One leaf of the pad: it flips up over the binding when its step is done, uncovering the next page. */
function Leaf({ i, p }: { i: number; p: MotionValue<number> }) {
  // the leaf lies flat for most of its stretch of scroll and turns in the middle of it, so it never rests half-turned
  const t = useTransform(p, [i + 0.25, i + 0.85], [0, 1], { clamp: true });
  const rotateX = useTransform(t, [0, 1], [0, 112]);
  const y = useTransform(t, [0, 1], [0, -18]);
  const opacity = useTransform(t, [0, 0.72, 0.92], [1, 1, 0]);
  // the page underneath sits in the shadow of the one above until that one lifts
  const shade = useTransform(p, [i - 0.75, i - 0.15], [0.32, 0], { clamp: true });
  return (
    <motion.div className="absolute inset-0 origin-top will-change-transform [backface-visibility:hidden]" style={{ rotateX, y, opacity, zIndex: N - i }}>
      <Page i={i} className="h-full" />
      {i > 0 && <motion.span aria-hidden style={{ opacity: shade }} className="pointer-events-none absolute inset-0 rounded-[10px] bg-[#040c14]" />}
    </motion.div>
  );
}

/**
 * Desktop: the section holds still while you scroll through the deal. The route is drawn across the top, the pages
 * of the passport flip up one by one with their stamp pressed as they come up, and the payments are ticked off.
 */
function Scene() {
  const box = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: box, offset: ["start start", "end end"] });
  const p = useTransform(scrollYProgress, [0, 1], [0, N - 1]);
  const [active, setActive] = useState(-1);
  useMotionValueEvent(scrollYProgress, "change", (v) => {
    // a page counts as up (and gets its stamp) once the leaf above it has turned
    const a = v <= 0.005 ? -1 : Math.min(N - 1, Math.floor(v * (N - 1) + 0.2));
    setActive((c) => (c === a ? c : a));
  });

  return (
    <div ref={box} className="relative mt-6 hidden lg:block" style={{ height: `calc(100svh + ${(N - 1) * 24}svh)` }}>
      <div className="sticky top-[100px] flex h-[calc(100svh-100px)] flex-col justify-center gap-10">
        <RouteLine p={p} active={active} />
        <div className="grid grid-cols-12 items-start gap-x-10">
          <div className="relative col-span-7 h-[min(460px,56svh)] [perspective:1800px]">
            {/* edges of the pages below, so the pad reads as a stack */}
            <span aria-hidden className="absolute inset-x-3 -bottom-3 h-full rounded-[10px] bg-[color-mix(in_srgb,var(--paper)_55%,var(--bg-2))]" />
            <span aria-hidden className="absolute inset-x-1.5 -bottom-1.5 h-full rounded-[10px] bg-[color-mix(in_srgb,var(--paper)_78%,var(--bg-2))]" />
            {STEPS.map((s, i) => (
              <Leaf key={s.title} i={i} p={p} />
            ))}
          </div>
          <div className="col-span-5">
            <Ledger active={Math.max(0, active)} />
          </div>
        </div>
      </div>
    </div>
  );
}

/** Reduced motion on wide screens: the same pages down a route line that fills as you scroll. */
function List({ className = "" }: { className?: string }) {
  const box = useRef<HTMLOListElement>(null);
  const { scrollYProgress } = useScroll({ target: box, offset: ["start 70%", "end 60%"] });
  return (
    <ol ref={box} className={`relative mt-8 flex flex-col gap-4 pl-7 ${className}`} aria-label="Процесс: шесть шагов">
      <span aria-hidden className="absolute top-3 bottom-3 left-[7px] w-[3px] bg-line-strong" />
      <motion.span aria-hidden style={{ scaleY: scrollYProgress }} className="absolute top-3 bottom-3 left-[7px] w-[3px] origin-top bg-accent" />
      {STEPS.map((s, i) => (
        <li key={s.title} className="relative">
          <span aria-hidden className="absolute top-8 -left-7 size-[17px] rounded-full border-[3px] border-accent bg-bg-2" />
          <Page i={i} />
        </li>
      ))}
    </ol>
  );
}

/**
 * Phones and tablets: the six pages side by side, swiped one at a time (a stack of tall cards took four screens).
 * The dots show where you are and jump to a page.
 */
function Swipe() {
  const box = useRef<HTMLDivElement>(null);
  const [at, setAt] = useState(0);
  const onScroll = () => {
    const el = box.current;
    const first = el?.firstElementChild as HTMLElement | null;
    if (!el || !first) return;
    const k = Math.round(el.scrollLeft / (first.offsetWidth + 12));
    setAt((c) => (c === k ? c : Math.min(N - 1, Math.max(0, k))));
  };
  const go = (k: number) => {
    const el = box.current;
    const card = el?.children[k] as HTMLElement | undefined;
    if (el && card) el.scrollTo({ left: card.offsetLeft - el.offsetLeft - 20, behavior: "smooth" });
  };
  return (
    <div className="mt-8 lg:hidden">
      <div
        ref={box}
        onScroll={onScroll}
        role="list"
        aria-label="Процесс: шесть шагов, листайте вбок"
        className="-mx-5 grid snap-x snap-mandatory auto-cols-[min(86%,520px)] grid-flow-col grid-rows-[auto_1fr] scroll-px-5 gap-x-3 overflow-x-auto px-5 pb-1 [scrollbar-width:none] sm:-mx-8 sm:scroll-px-8 sm:px-8"
      >
        {STEPS.map((s, i) => (
          <div key={s.title} role="listitem" className="row-span-2 grid snap-start grid-rows-subgrid">
            <Page i={i} aligned />
          </div>
        ))}
      </div>
      <div className="mt-2 flex items-center justify-between gap-3">
        <p className="text-ui font-bold text-ink-2">
          Шаг {at + 1} из {N}
        </p>
        <div className="flex" role="group" aria-label="Шаги сделки">
          {STEPS.map((s, i) => (
            <button key={s.title} type="button" aria-label={`Шаг ${i + 1}: ${s.title}`} aria-current={i === at} onClick={() => go(i)} className="grid h-11 w-[30px] cursor-pointer place-items-center">
              <span className={`block h-2 rounded-full transition-[width,background-color] duration-300 ${i === at ? "w-5 bg-accent" : i < at ? "w-2 bg-accent/60" : "w-2 bg-line-strong"}`} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Phones and tablets: "Этапы оплаты" as a plain numbered list under the swiped steps. */
function Stages() {
  return (
    <div className="mt-10 lg:hidden">
      <h3 className="font-display text-[clamp(1.625rem,6vw,2.125rem)] leading-[1.1] tracking-title uppercase">Этапы оплаты</h3>
      <p className="mt-2 text-body-lg leading-body text-ink-2">Все платежи официальные на имя покупателя.</p>
      <ol className="mt-5 grid gap-2.5">
        {DEAL_STAGES.map((d, k) => (
          <li key={d.pay} className="flex gap-4 rounded-[10px] bg-surface px-4 py-4">
            <span className="num grid size-9 shrink-0 place-items-center rounded-full bg-[var(--accent-fill)] text-body text-white">{k + 1}</span>
            <div className="min-w-0">
              <p className="text-body-lg leading-snug font-bold text-ink">{d.pay}</p>
              <p className="mt-1 text-ui leading-body text-ink-2">{d.when}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

export function Deal() {
  // read after mount, so the server and the first client render agree
  const [calm, setCalm] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCalm(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);
  return (
    <>
      <Swipe />
      <Stages />
      {calm ? <List className="hidden lg:flex" /> : <Scene />}
    </>
  );
}
