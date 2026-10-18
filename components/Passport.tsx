"use client";

import { motion, useReducedMotion } from "motion/react";
import Image from "next/image";
import { asset } from "@/lib/asset";
import { DUR, EASE } from "@/lib/motion";
import { DEAL_STAGES, STEPS } from "@/lib/data";
import { NjIcon, type IconName } from "./NjIcon";

// Which payment belongs to which step (order of the two lists in lib/data.ts)
const PAY_AT: Record<number, number> = { 1: 0, 3: 1, 4: 2, 5: 3 };
const PAY_NOTE: Record<number, string> = { 0: "Платить пока не нужно", 2: "Входит в аванс" };
const STEP_ICON: IconName[] = ["form", "car", "inspect", "rub", "ship", "key"];
const STATUS = ["ПРИНЯТО", "ПОДОБРАНО", "ПРОВЕРЕНО", "ВЫКУПЛЕНО", "В ПУТИ", "ВЫДАНО"];

const TOP = 92; // px from the top where the first card sticks
const TAB = 58; // px of every earlier card that stays visible

/**
 * "Deal passport": the six steps are the pages of a document, laid on top of each other. As you scroll, each new page
 * slides up over the previous one, and the earlier pages stay in view as tabs, so all six are always visible together.
 * On every page the red NJ Motors seal (cut from the logo) and a status stamp are pressed as it arrives.
 */
export function Passport() {
  const calm = useReducedMotion();
  return (
    <ol className="relative mt-10 lg:mt-14" aria-label="Паспорт сделки: шесть шагов">
      {STEPS.map((s, i) => {
        const pay = i in PAY_AT ? DEAL_STAGES[PAY_AT[i]] : null;
        return (
          <li key={s.title} className="sticky mx-auto w-full max-w-[820px] pb-[34svh] last:pb-0" style={{ top: TOP + i * TAB, zIndex: i + 1 }}>
            <article className="relative flex h-[min(430px,62svh)] flex-col overflow-hidden rounded-[8px] border border-[rgba(18,16,13,0.4)] bg-[var(--paper)] text-[var(--paper-ink)] shadow-[0_-14px_30px_-18px_var(--shadow),0_24px_40px_-26px_var(--shadow)]">
              {/* the binding */}
              <span aria-hidden className="absolute inset-y-0 left-0 w-[14px] bg-[repeating-linear-gradient(180deg,rgba(18,16,13,0.5)_0_10px,transparent_10px_22px)] opacity-40" />

              {/* the strip that stays visible once the next page covers the rest */}
              <div className="flex shrink-0 items-center gap-3 border-b-2 border-dashed border-[rgba(18,16,13,0.4)] px-7 pl-9" style={{ height: TAB }}>
                <span className="num text-[26px] leading-none text-[var(--accent-fill)]">{String(i + 1).padStart(2, "0")}</span>
                <NjIcon name={STEP_ICON[i]} className="size-8 shrink-0" />
                <span className="font-display min-w-0 flex-1 truncate text-[clamp(17px,2.2vw,22px)] tracking-wide uppercase">{s.title}</span>
                <span className="hidden text-[13px] font-bold tracking-[0.14em] whitespace-nowrap uppercase opacity-60 sm:inline">Паспорт сделки · NJ Motors</span>
                <span className="num text-[15px] opacity-70">
                  {i + 1} / {STEPS.length}
                </span>
              </div>

              <div className="flex flex-1 flex-col px-7 py-5 pl-9">
                <p className="max-w-[46ch] pr-[26%] text-[clamp(17px,1.6vw,19px)] leading-snug">{s.text}</p>

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
          </li>
        );
      })}
      <li aria-hidden className="h-[6svh]" />
    </ol>
  );
}
