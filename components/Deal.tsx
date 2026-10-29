"use client";

import { Check } from "lucide-react";
import { AnimatePresence, motion, useMotionValueEvent, useReducedMotion, useScroll, useTransform, type MotionValue } from "motion/react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { asset } from "@/lib/asset";
import { DEAL_STAGES, STEPS } from "@/lib/data";
import { DUR, EASE } from "@/lib/motion";
import { nb } from "@/lib/typo";
import { NjIcon, type IconName } from "./NjIcon";

const N = STEPS.length;
// Which payment belongs to which step (order of the two lists in lib/data.ts), and the step each payment is made on
const PAY_AT: Record<number, number> = { 1: 0, 3: 1, 4: 2, 5: 3 };
const PAY_STEP = [1, 3, 4, 5];
const PAY_NOTE: Record<number, string> = { 0: "Платить пока не нужно", 2: "Входит в аванс" };
const STEP_ICON: IconName[] = ["form", "car", "inspect", "rub", "ship", "key"];
const STATUS = ["ПРИНЯТО", "ПОДОБРАНО", "ПРОВЕРЕНО", "ВЫКУПЛЕНО", "В ПУТИ", "ВЫДАНО"];
const PLACE = ["Вы", "Корея", "Корея", "Корея", "Пусан → Владивосток", "Ваш город"];
const STOP_NAME = ["Заявка", "Подбор", "Проверка", "Выкуп", "Море и таможня", "Ключи"];

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

const stampV = {
  off: { opacity: 0, scale: 1.9, rotate: -22 },
  on: { opacity: 0.94, scale: 1, rotate: -9 },
};
const splashV = {
  off: { opacity: 0, scale: 0.6 },
  on: { opacity: [0, 0.5, 0], scale: [0.6, 1, 1.5] },
};

/**
 * One page of the deal passport: what happens, where, what you pay at this point, and the seal with the status
 * stamp, pressed when the page comes up (pressed given) or when it scrolls into view (pressed left out).
 * The stamp sits beside the payment, never over the text.
 */
function Page({ i, pressed, className = "" }: { i: number; pressed?: boolean; className?: string }) {
  const calm = useReducedMotion();
  const s = STEPS[i];
  const pay = i in PAY_AT ? DEAL_STAGES[PAY_AT[i]] : null;
  const press = calm
    ? { initial: "on" as const }
    : pressed === undefined
      ? { initial: "off" as const, whileInView: "on" as const, viewport: { once: true, amount: 0.6 } }
      : { initial: "off" as const, animate: pressed ? "on" : "off" };
  return (
    <article className={`relative flex flex-col overflow-hidden rounded-[6px] bg-[var(--paper)] text-[var(--paper-ink)] shadow-[0_1px_0_rgba(18,16,13,0.18),0_22px_40px_-26px_var(--shadow)] ${className}`}>
      {/* punched holes of the binding along the top edge */}
      <span aria-hidden className="absolute inset-x-8 top-3 flex justify-between">
        {Array.from({ length: 9 }, (_, k) => (
          <i key={k} className="block size-2.5 rounded-full bg-[rgba(18,16,13,0.32)]" />
        ))}
      </span>

      <header className="flex items-center gap-3.5 border-b-2 border-dashed border-[rgba(18,16,13,0.3)] px-6 pt-9 pb-4 lg:px-8">
        <NjIcon name={STEP_ICON[i]} className="size-9 shrink-0" />
        <div className="min-w-0">
          <h3 className="font-display text-[clamp(21px,2.2vw,27px)] leading-none tracking-wide uppercase">{s.title}</h3>
          <p className="mt-1.5 text-[15px] font-medium opacity-75">{PLACE[i]}</p>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-5 px-6 py-5 lg:px-8">
        <p className="max-w-[46ch] text-[17px] leading-snug lg:text-[18px]">{nb(s.text)}</p>

        <div className="mt-auto flex items-end gap-4">
          <div className="min-w-0 flex-1 rounded-[4px] bg-[rgba(18,16,13,0.08)] px-4 py-3.5">
            {pay ? (
              <>
                <p className="text-[15px] font-bold opacity-70">Платёж {PAY_AT[i] + 1} из 4</p>
                <p className="mt-0.5 text-[17px] leading-snug font-bold">{pay.pay}</p>
                <p className="mt-0.5 text-[15px] leading-snug opacity-80">{pay.when}</p>
              </>
            ) : (
              <p className="text-[17px] font-bold">{PAY_NOTE[i]}</p>
            )}
          </div>

          <div aria-hidden className="relative aspect-[6/5] w-[84px] shrink-0 sm:w-[min(34%,150px)]">
            <motion.div {...press} variants={stampV} transition={{ duration: DUR, ease: EASE }} className="absolute inset-0">
              <Image src={asset("/brand/nj-seal.webp")} alt="" width={576} height={480} className="block size-full object-contain opacity-90" />
            </motion.div>
            <motion.span
              {...press}
              variants={splashV}
              transition={{ duration: DUR, ease: EASE, delay: 0.18 }}
              className="absolute inset-[8%] rounded-full border-[3px] border-[var(--accent-fill)]"
            />
            <motion.span
              {...press}
              variants={{ off: { opacity: 0, scale: 2, rotate: 18 }, on: { opacity: 0.92, scale: 1, rotate: 6 } }}
              transition={{ duration: DUR, ease: EASE, delay: 0.22 }}
              className="absolute top-1/2 left-1/2 -mt-4 -ml-[50%] w-full text-center"
            >
              <span
                className="inline-block rounded-[4px] border-[3px] border-[var(--accent-fill)] bg-[var(--paper)]/70 px-2 py-0.5 text-[clamp(14px,1.4vw,17px)] tracking-[0.06em] whitespace-nowrap text-[var(--accent-fill)]"
                style={{ fontFamily: "var(--font-russo)" }}
              >
                {STATUS[i]}
              </span>
            </motion.span>
          </div>
        </div>
      </div>
    </article>
  );
}

/** The route over the scene: the red line is drawn as you scroll and the emblem drives along it, stop to stop. */
function RouteLine({ p, active }: { p: MotionValue<number>; active: number }) {
  const path = useRef<SVGPathElement>(null);
  const car = useRef<HTMLDivElement>(null);
  const lut = useRef<{ len: number; pts: { x: number; y: number }[] }>(null);

  const draw = (v: number) => {
    const el = path.current;
    if (!el) return;
    if (!lut.current) {
      const len = el.getTotalLength();
      lut.current = { len, pts: Array.from({ length: 241 }, (_, k) => el.getPointAtLength((len * k) / 240)) };
    }
    const { len, pts } = lut.current;
    const k = Math.min(1, Math.max(0, v / (N - 1)));
    el.style.strokeDasharray = `${len}`;
    el.style.strokeDashoffset = `${len * (1 - k)}`;
    const j = Math.round(k * 240);
    const pt = pts[j];
    const ahead = pts[Math.min(240, j + 2)];
    const ang = j < 239 ? (Math.atan2(ahead.y - pt.y, ahead.x - pt.x) * 180) / Math.PI : 0;
    if (car.current) car.current.style.transform = `translate(${pt.x / 10}cqw, ${(pt.y / 120) * 100}cqh) translate(-50%, -50%) rotate(${ang * 0.3}deg)`;
  };
  useMotionValueEvent(p, "change", draw);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => draw(p.get()), []);

  return (
    <div className="relative h-[120px] [container-type:size]" aria-hidden>
      <svg viewBox="0 0 1000 120" preserveAspectRatio="none" className="absolute inset-0 size-full overflow-visible">
        <path d={D} fill="none" stroke="var(--line-strong)" strokeWidth="2" strokeDasharray="3 9" vectorEffect="non-scaling-stroke" />
        <path ref={path} d={D} fill="none" stroke="var(--accent)" strokeWidth="4" strokeLinecap="round" vectorEffect="non-scaling-stroke" style={{ strokeDasharray: 3000, strokeDashoffset: 3000 }} />
      </svg>
      {STOPS.map(([x, y], i) => (
        <div key={i} className="absolute" style={{ left: `${x / 10}%`, top: `${(y / 120) * 100}%` }}>
          <span className={`absolute size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] transition-colors duration-700 ${i <= active ? "border-accent bg-accent" : "border-line-strong bg-bg-2"}`} />
          <span
            className={`absolute left-0 -translate-x-1/2 text-[15px] font-bold whitespace-nowrap transition-colors duration-700 ${y > 60 ? "top-7" : "bottom-7"} ${i <= active ? "text-ink" : "text-ink-3"}`}
          >
            {STOP_NAME[i]}
          </span>
        </div>
      ))}
      <div ref={car} className="absolute top-0 left-0 w-[52px]">
        <Image src={asset("/brand/nj-logo-full.webp")} alt="" width={160} height={160} className="block size-full" />
      </div>
    </div>
  );
}

/** The four payments beside the pad: the one due at this step is lit, the ones behind you are ticked. */
function Ledger({ active }: { active: number }) {
  const note = PAY_NOTE[active];
  return (
    <div>
      <h3 className="font-display text-[clamp(22px,2vw,28px)] leading-none tracking-wide uppercase">Четыре платежа</h3>
      <p className="mt-3 max-w-[34ch] text-[17px] leading-snug text-ink-2">Каждый после результата, который вы уже видите.</p>
      <ol className="mt-6 flex flex-col gap-1.5">
        {DEAL_STAGES.map((d, k) => {
          const state = PAY_STEP[k] < active ? "done" : PAY_STEP[k] === active ? "now" : "next";
          return (
            <li
              key={d.name}
              className={`flex gap-4 rounded-[6px] px-4 py-3.5 transition-[background-color,opacity] duration-700 ${state === "now" ? "bg-surface-2" : ""} ${state === "next" ? "opacity-50" : ""}`}
            >
              <span
                className={`mt-0.5 grid size-7 shrink-0 place-items-center rounded-full transition-colors duration-700 ${state === "next" ? "border-2 border-line-strong" : "bg-accent text-on-accent"}`}
              >
                {state === "done" && <Check className="size-4" strokeWidth={3} />}
              </span>
              <div className="min-w-0">
                <p className="text-[17px] leading-snug font-bold text-ink">{d.pay}</p>
                <p className="mt-0.5 text-[15px] leading-snug text-ink-2">{d.when}</p>
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
              className="px-4 text-[17px] font-bold text-accent-ink"
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
function Leaf({ i, p, active }: { i: number; p: MotionValue<number>; active: number }) {
  // the leaf lies flat for most of its stretch of scroll and turns in the middle of it, so it never rests half-turned
  const t = useTransform(p, [i + 0.25, i + 0.85], [0, 1], { clamp: true });
  const rotateX = useTransform(t, [0, 1], [0, 112]);
  const y = useTransform(t, [0, 1], [0, -18]);
  const opacity = useTransform(t, [0, 0.72, 0.92], [1, 1, 0]);
  // the page underneath sits in the shadow of the one above until that one lifts
  const shade = useTransform(p, [i - 0.75, i - 0.15], [0.32, 0], { clamp: true });
  return (
    <motion.div className="absolute inset-0 origin-top will-change-transform [backface-visibility:hidden]" style={{ rotateX, y, opacity, zIndex: N - i }}>
      <Page i={i} pressed={active >= i} className="h-full" />
      {i > 0 && <motion.span aria-hidden style={{ opacity: shade }} className="pointer-events-none absolute inset-0 rounded-[6px] bg-[#040c14]" />}
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
    <div ref={box} className="relative mt-6 hidden lg:block" style={{ height: `calc(100svh + ${(N - 1) * 42}svh)` }}>
      <div className="sticky top-[100px] flex h-[calc(100svh-100px)] flex-col justify-center gap-10">
        <RouteLine p={p} active={active} />
        <div className="grid grid-cols-12 items-start gap-x-10">
          <div className="relative col-span-7 h-[min(400px,46svh)] [perspective:1800px]">
            {/* edges of the pages below, so the pad reads as a stack */}
            <span aria-hidden className="absolute inset-x-3 -bottom-3 h-full rounded-[6px] bg-[color-mix(in_srgb,var(--paper)_55%,var(--bg-2))]" />
            <span aria-hidden className="absolute inset-x-1.5 -bottom-1.5 h-full rounded-[6px] bg-[color-mix(in_srgb,var(--paper)_78%,var(--bg-2))]" />
            {STEPS.map((s, i) => (
              <Leaf key={s.title} i={i} p={p} active={active} />
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

/** Phones and reduced motion: the same pages down a route line that fills as you scroll; each stamp lands in view. */
function List({ className = "" }: { className?: string }) {
  const box = useRef<HTMLOListElement>(null);
  const { scrollYProgress } = useScroll({ target: box, offset: ["start 70%", "end 60%"] });
  return (
    <ol ref={box} className={`relative mt-10 flex flex-col gap-6 pl-7 ${className}`} aria-label="Паспорт сделки: шесть шагов">
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

export function Deal() {
  // read after mount, so the server and the first client render agree
  const [calm, setCalm] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCalm(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);
  return (
    <>
      <List className={calm ? "" : "lg:hidden"} />
      {!calm && <Scene />}
    </>
  );
}
