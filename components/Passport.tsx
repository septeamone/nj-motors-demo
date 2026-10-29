"use client";

import { motion, useMotionValueEvent, useReducedMotion, useScroll, useSpring, useTransform } from "motion/react";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { asset } from "@/lib/asset";
import { DUR, EASE } from "@/lib/motion";
import { nb } from "@/lib/typo";
import { DEAL_STAGES, STEPS } from "@/lib/data";
import { NjIcon, type IconName } from "./NjIcon";

// Which payment belongs to which step (order of the two lists in lib/data.ts)
const PAY_AT: Record<number, number> = { 1: 0, 3: 1, 4: 2, 5: 3 };
const PAY_NOTE: Record<number, string> = { 0: "Платить пока не нужно", 2: "Входит в аванс" };
const STEP_ICON: IconName[] = ["form", "car", "inspect", "rub", "ship", "key"];
const STATUS = ["ПРИНЯТО", "ПОДОБРАНО", "ПРОВЕРЕНО", "ВЫКУПЛЕНО", "В ПУТИ", "ВЫДАНО"];

const TOP = 112; // px from the top where the first card sticks
const TAB = 58; // px of every earlier card that stays visible

function Page({ i, className = "" }: { i: number; className?: string }) {
  const calm = useReducedMotion();
  const s = STEPS[i];
  const pay = i in PAY_AT ? DEAL_STAGES[PAY_AT[i]] : null;
  return (
      <article className={`relative flex flex-col overflow-hidden rounded-[8px] border border-[rgba(18,16,13,0.4)] bg-[var(--paper)] text-[var(--paper-ink)] shadow-[0_-14px_30px_-18px_var(--shadow),0_24px_40px_-26px_var(--shadow)] ${className}`}>
        {/* the binding */}
        <span aria-hidden className="absolute inset-y-0 left-0 w-[14px] bg-[repeating-linear-gradient(180deg,rgba(18,16,13,0.5)_0_10px,transparent_10px_22px)] opacity-40" />
  
        {/* the strip that stays visible once the next page covers the rest */}
        <div className="flex shrink-0 items-center gap-3 border-b-2 border-dashed border-[rgba(18,16,13,0.4)] px-7 pl-9" style={{ height: TAB }}>
          <span className="num text-[26px] leading-none text-[var(--accent-fill)]">{String(i + 1).padStart(2, "0")}</span>
          <NjIcon name={STEP_ICON[i]} className="size-8 shrink-0" />
          <span className="font-display min-w-0 flex-1 truncate text-[clamp(17px,2.2vw,22px)] tracking-wide uppercase">{s.title}</span>
          <span className="hidden text-[13px] font-bold tracking-[0.14em] whitespace-nowrap uppercase opacity-60 2xl:inline">Паспорт сделки · NJ Motors</span>
          <span className="num hidden text-[15px] opacity-70 sm:inline">
            {i + 1} / {STEPS.length}
          </span>
        </div>
  
        <div className="flex flex-1 flex-col px-7 py-5 pl-9">
          <p className="max-w-[46ch] pr-[40%] sm:pr-[36%] text-[clamp(17px,1.6vw,19px)] leading-snug">{nb(s.text)}</p>
  
          <div className="mt-auto pr-[34%]">
            {pay ? (
              <div className="border-2 border-[rgba(18,16,13,0.55)] p-3.5">
                <p className="text-[14px] font-bold tracking-[0.12em] uppercase opacity-70">Платёж {PAY_AT[i] + 1} из 4</p>
                <p className="mt-1 text-[17px] leading-snug font-bold">{pay.pay}</p>
                <p className="mt-1 text-[15px] leading-snug opacity-80">{pay.when}</p>
              </div>
            ) : (
              <p className="border-2 border-[rgba(18,16,13,0.55)] p-3.5 text-[17px] font-bold">{PAY_NOTE[i]}</p>
            )}
          </div>
        </div>
  
        {/* seal + status stamp, pressed when the page comes into view */}
        <motion.div
          aria-hidden
          initial={calm ? false : { opacity: 0, scale: 2.4, rotate: -22 }}
          whileInView={{ opacity: 0.94, scale: 1, rotate: -9 }}
          viewport={{ once: true, amount: 0.7 }}
          transition={{ duration: DUR, ease: EASE, delay: 0.2 }}
          className="pointer-events-none absolute right-5 bottom-5 w-[min(30%,180px)] mix-blend-multiply"
        >
          <Image src={asset("/brand/nj-seal.webp")} alt="" width={576} height={480} className="block h-auto w-full" />
        </motion.div>
        <motion.span
          aria-hidden
          initial={calm ? false : { opacity: 0, scale: 2, rotate: 20 }}
          whileInView={{ opacity: 0.9, scale: 1, rotate: 5 }}
          viewport={{ once: true, amount: 0.7 }}
          transition={{ duration: DUR, ease: EASE, delay: 0.4 }}
          className="pointer-events-none absolute top-[78px] right-6 rounded-[4px] border-[3px] border-[var(--accent-fill)] px-3 py-1 text-[clamp(18px,2.4vw,26px)] tracking-[0.08em] text-[var(--accent-fill)]"
          style={{ fontFamily: "var(--font-russo)" }}
        >
          {STATUS[i]}
        </motion.span>
      </article>
  );
}

/**
 * "Deal passport": the six steps are the pages of a document, laid on top of each other. As you scroll, each new page
 * slides up over the previous one, and the earlier pages stay in view as tabs, so all six are always visible together.
 * On every page the red NJ Motors seal (cut from the logo) and a status stamp are pressed as it arrives.
 */
function Stack({ className = "" }: { className?: string }) {
  return (
    <ol className={`relative mt-8 lg:mt-10 ${className}`} aria-label="Паспорт сделки: шесть шагов">
      {STEPS.map((s, i) => {
        return (
          <li key={s.title} className="sticky mx-auto w-full max-w-[820px] pb-[16svh] last:pb-0 lg:pb-[24svh] lg:[transform:translateX(var(--dx))_rotate(var(--rot))]" style={{ top: TOP + i * TAB, zIndex: i + 1, ["--dx" as string]: `${[-26, 22, -14, 30, -22, 12][i]}px`, ["--rot" as string]: `${[-0.5, 0.45, -0.3, 0.55, -0.4, 0.2][i]}deg` }}>
            <Page i={i} className="h-[min(340px,56svh)] sm:h-[min(370px,58svh)]" />
          </li>
        );
      })}
      <li aria-hidden className="h-[6svh]" />
    </ol>
  );
}

const HEADER = 76; // px of the fixed header the rail sits under

/**
 * Desktop: the same six pages as a rail. The section pins to the screen and vertical scrolling pulls the pages
 * sideways (smoothed with a spring); the page in focus is lit, the others sit back, and a ruler underneath counts the steps.
 */
function Rail() {
  const box = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLOListElement>(null);
  const [dist, setDist] = useState(0);
  const [active, setActive] = useState(0);
  const { scrollYProgress } = useScroll({ target: box, offset: ["start start", "end end"] });
  const smooth = useSpring(scrollYProgress, { stiffness: 110, damping: 28, mass: 0.35 });
  const x = useTransform(smooth, [0, 1], [0, -dist]);

  useEffect(() => {
    const measure = () => {
      if (track.current && stage.current) setDist(Math.max(0, track.current.scrollWidth - stage.current.clientWidth));
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (stage.current) ro.observe(stage.current);
    return () => ro.disconnect();
  }, []);

  useMotionValueEvent(scrollYProgress, "change", (p) => setActive(Math.min(STEPS.length - 1, Math.max(0, Math.round(p * (STEPS.length - 1))))));

  return (
    <div ref={box} className="relative mt-14 ml-[calc(50%-50vw)] hidden w-[100vw] lg:block" style={{ height: `calc(100svh - ${HEADER}px + ${(STEPS.length - 1) * 48}vh)` }}>
      <div ref={stage} className="sticky flex flex-col justify-center overflow-hidden" style={{ top: HEADER, height: `calc(100svh - ${HEADER}px)` }}>
        <div className="mb-6 flex items-baseline justify-between px-[max(2rem,calc((100vw-var(--page))/2+3rem))] xl:px-[max(5rem,calc((100vw-var(--page))/2+5rem))]">
          <p className="num text-[clamp(40px,4vw,64px)] leading-none text-accent-ink">{String(active + 1).padStart(2, "0")}</p>
          <p className="text-[13.5px] font-medium tracking-[0.14em] text-ink-2 uppercase">Паспорт сделки · {STEPS[active].title}</p>
        </div>

        <motion.ol ref={track} style={{ x }} className="flex w-max gap-8 px-[max(2rem,calc((100vw-var(--page))/2+3rem))] xl:px-[max(5rem,calc((100vw-var(--page))/2+5rem))]" aria-label="Паспорт сделки: шесть шагов">
          {STEPS.map((s, i) => (
            <li key={s.title} className="w-[min(640px,46vw)] shrink-0 transition-[opacity,scale] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]" style={{ opacity: i === active ? 1 : 0.5, scale: i === active ? 1 : 0.965 }}>
              <Page i={i} className="h-[min(420px,52svh)]" />
            </li>
          ))}
        </motion.ol>

        <div aria-hidden className="mt-8 px-[max(2rem,calc((100vw-var(--page))/2+3rem))] xl:px-[max(5rem,calc((100vw-var(--page))/2+5rem))]">
          <div className="relative h-[3px] bg-line-strong">
            <motion.span style={{ scaleX: smooth }} className="absolute inset-0 origin-left bg-accent" />
          </div>
          <div className="mt-3 flex justify-between text-[13px] font-bold tracking-[0.1em] text-ink-3 uppercase">
            {STEPS.map((s, i) => (
              <span key={s.title} className={i === active ? "text-ink" : ""}>
                {String(i + 1).padStart(2, "0")}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Phones and reduced motion: the pages lie on top of each other and stay in view as tabs. Desktop with motion: the rail. */
export function Passport() {
  // read after mount, so the server and the first client render agree
  const [calm, setCalm] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCalm(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);
  return (
    <>
      <Stack className={calm ? "" : "lg:hidden"} />
      {!calm && <Rail />}
    </>
  );
}
