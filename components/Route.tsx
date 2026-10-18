"use client";

import { motion, useMotionValueEvent, useReducedMotion, useScroll } from "motion/react";
import Image from "next/image";
import { useRef, useState } from "react";
import { asset } from "@/lib/asset";
import { DUR, EASE } from "@/lib/motion";
import { NjIcon } from "./NjIcon";

// Stops along the way: x on the 1000-wide drawing, y on the 200-high drawing, and the stamp pressed there.
const STOPS = [
  { x: 40, y: 150, name: "Заявка", place: "Вы", stamp: "ДОГОВОР", icon: "form" },
  { x: 290, y: 70, name: "Выкуп", place: "Корея", stamp: "ВЫКУПЛЕНО", icon: "car" },
  { x: 520, y: 128, name: "Порт", place: "Пусан → Владивосток", stamp: "В ПУТИ", icon: "port" },
  { x: 760, y: 56, name: "Таможня", place: "Владивосток", stamp: "ТАМОЖНЯ", icon: "stamp" },
  { x: 960, y: 118, name: "Ключи", place: "Ваш город", stamp: "ВЫДАНО", icon: "key" },
] as const;

const D = `M ${STOPS[0].x} ${STOPS[0].y} C 140 150, 170 70, ${STOPS[1].x} ${STOPS[1].y} S 430 150, ${STOPS[2].x} ${STOPS[2].y} S 650 56, ${STOPS[3].x} ${STOPS[3].y} S 900 118, ${STOPS[4].x} ${STOPS[4].y}`;

/**
 * The route as a document: scrolling draws the line from the buyer to Korea to Vladivostok and home,
 * the emblem drives along it, and a red stamp is pressed at every stop it passes.
 */
/** Phones: the same route, drawn top to bottom; each stop is stamped as it scrolls into view. */
function RouteVertical() {
  const box = useRef<HTMLOListElement>(null);
  const { scrollYProgress } = useScroll({ target: box, offset: ["start 75%", "end 55%"] });
  return (
    <ol ref={box} className="relative mt-10 ml-3 lg:hidden" aria-label="Маршрут: заявка, Корея, порт, таможня, ключи">
      <span aria-hidden className="absolute top-2 bottom-2 left-0 w-[3px] bg-line-strong" />
      <motion.span aria-hidden style={{ scaleY: scrollYProgress }} className="absolute top-2 bottom-2 left-0 w-[3px] origin-top bg-accent" />
      {STOPS.map((s) => (
        <li key={s.name} className="relative pb-6 pl-8 last:pb-0">
          <span aria-hidden className="absolute top-1 -left-[7px] size-[17px] rounded-full border-[3px] border-accent bg-bg" />
          <p className="flex items-center gap-2.5 text-[20px] font-bold text-ink">
            <NjIcon name={s.icon} className="size-8" />
            {s.name}
          </p>
          <p className="text-[16px] text-ink-3">{s.place}</p>
          <motion.span
            aria-hidden
            initial={{ opacity: 0, scale: 1.9, rotate: -22 }}
            whileInView={{ opacity: 1, scale: 1, rotate: -7 }}
            viewport={{ once: true, amount: 1 }}
            transition={{ duration: DUR, ease: EASE }}
            className="mt-3 inline-block rounded-[4px] border-[3px] border-accent px-2.5 py-1 text-[16px] tracking-[0.08em] text-accent"
            style={{ fontFamily: "var(--font-russo)" }}
          >
            {s.stamp}
          </motion.span>
        </li>
      ))}
    </ol>
  );
}

export function Route() {
  return (
    <>
      <RouteDesktop />
      <RouteVertical />
    </>
  );
}

function RouteDesktop() {
  const box = useRef<HTMLDivElement>(null);
  const path = useRef<SVGPathElement>(null);
  const car = useRef<HTMLDivElement>(null);
  const calm = useReducedMotion();
  const [reached, setReached] = useState(calm ? STOPS.length : 0);
  const { scrollYProgress } = useScroll({ target: box, offset: ["start 85%", "end 35%"] });

  useMotionValueEvent(scrollYProgress, "change", (p) => {
    const el = path.current;
    if (!el) return;
    const len = el.getTotalLength();
    const k = calm ? 1 : Math.min(1, Math.max(0, p));
    el.style.strokeDasharray = `${len}`;
    el.style.strokeDashoffset = `${len * (1 - k)}`;
    const pt = el.getPointAtLength(len * k);
    const ahead = el.getPointAtLength(Math.min(len, len * k + 2));
    const ang = (Math.atan2(ahead.y - pt.y, ahead.x - pt.x) * 180) / Math.PI;
    if (car.current) car.current.style.transform = `translate(${(pt.x / 1000) * 100}cqw, ${(pt.y / 200) * 100}cqh) translate(-50%, -50%) rotate(${ang * 0.35}deg)`;
    const n = STOPS.filter((s) => pt.x >= s.x - 6).length;
    setReached((v) => (v === n ? v : n));
  });

  return (
    <div ref={box} className="relative mt-12 hidden lg:block" aria-label="Маршрут: заявка, Корея, порт, таможня, ключи">
      <div className="relative h-[250px] [container-type:size]">
        <svg viewBox="0 0 1000 200" preserveAspectRatio="none" className="absolute inset-0 size-full overflow-visible" aria-hidden>
          <path d={D} fill="none" stroke="var(--line-strong)" strokeWidth="2" strokeDasharray="3 9" vectorEffect="non-scaling-stroke" />
          <path ref={path} d={D} fill="none" stroke="var(--accent)" strokeWidth="4" strokeLinecap="round" vectorEffect="non-scaling-stroke" style={{ strokeDasharray: 3000, strokeDashoffset: 3000 }} />
        </svg>

        {STOPS.map((s, i) => (
          <div key={s.name} className="absolute" style={{ left: `${s.x / 10}%`, top: `${(s.y / 200) * 100}%` }}>
            <span aria-hidden className={`absolute size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] transition-colors duration-300 ${i < reached ? "border-accent bg-accent" : "border-line-strong bg-bg"}`} />
            <motion.span
              aria-hidden
              initial={false}
              animate={i < reached ? { opacity: 1, scale: 1, rotate: [-12, -7][i % 2] } : { opacity: 0, scale: 1.9, rotate: -24 }}
              transition={{ duration: DUR, ease: EASE }}
              className="absolute -top-[58px] left-3 whitespace-nowrap rounded-[4px] border-[3px] border-accent px-2.5 py-1 text-[15px] tracking-[0.08em] text-accent"
              style={{ fontFamily: "var(--font-russo)", background: "color-mix(in srgb, var(--accent) 8%, transparent)" }}
            >
              {s.stamp}
            </motion.span>
            <p className="absolute top-[30px] -left-14 flex w-36 flex-col items-center text-center">
              <NjIcon name={s.icon} className="mb-1 size-8" />
              <span className="block text-[17px] font-bold text-ink">{s.name}</span>
              <span className="block text-[14.5px] leading-tight text-ink-3">{s.place}</span>
            </p>
          </div>
        ))}

        <div ref={car} className="absolute top-0 left-0 w-[58px] drop-shadow-[0_8px_10px_var(--shadow)]" style={{ transform: "translate(0,0)" }}>
          <Image src={asset("/brand/nj-logo-full.webp")} alt="" width={160} height={160} className="block size-full" />
        </div>
      </div>
    </div>
  );
}
