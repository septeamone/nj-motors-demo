"use client";

import { motion, useReducedMotion } from "motion/react";
import Image from "next/image";
import { asset } from "@/lib/asset";
import { DUR, EASE } from "@/lib/motion";

/** The brand lightning: a decorative motif drawn after the bolts of the logo (the logo itself is never redrawn). */
export function Bolt({ className = "", size = 16 }: { className?: string; size?: number }) {
  return (
    <svg aria-hidden width={size * 0.72} height={size} viewBox="0 0 72 100" className={className} fill="currentColor">
      <path d="M44 0 4 56h27L20 100 68 38H41z" />
    </svg>
  );
}

/** Small round mark from the logo + wordmark. */
export function Wordmark({ className = "", tagline = true }: { className?: string; tagline?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-3 ${className}`}>
      <Image
        src={asset("/brand/nj-roundel-256.webp")}
        alt=""
        width={48}
        height={48}
        className="size-11 shrink-0 rounded-full sm:size-12"
      />
      <span className="leading-none">
        <span className="font-display block text-[22px] font-semibold tracking-[0.06em] text-ink uppercase">NJ Motors</span>
        {tagline && (
          <span className="mono mt-1 hidden !text-[16px] !tracking-[0.2em] text-ink-3 sm:block">Cars from Korea · est. 2023</span>
        )}
      </span>
    </span>
  );
}

/** The red stamp of the logo, as a small decorative seal. */
export function Seal({ className = "" }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={`inline-grid place-items-center rounded-[3px] border-2 border-accent px-2.5 py-1.5 text-center leading-[1.15] font-bold text-accent-ink [font-family:'Malgun_Gothic','Apple_SD_Gothic_Neo','Noto_Sans_KR',sans-serif] text-[16px] ${className}`}
    >
      엔제이
      <br />
      모터스
    </span>
  );
}

/** Heading whose words rise out from under a mask, line by line. */
export function Lines({
  text,
  className,
  as = "h2",
  delay = 0,
}: {
  text: string;
  className?: string;
  as?: "h1" | "h2" | "h3" | "p";
  delay?: number;
}) {
  const reduce = useReducedMotion();
  const Tag = motion[as];
  const words = text.split(" ");
  return (
    <Tag
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "0px 0px -80px 0px" }}
      transition={{ staggerChildren: reduce ? 0 : 0.045, delayChildren: delay }}
      aria-label={text}
    >
      {words.map((w, i) => (
        <span key={i} aria-hidden>
          <span className="inline-block overflow-hidden pb-[0.12em] align-bottom">
            <motion.span
              className="inline-block"
              variants={{ hidden: { y: reduce ? 0 : "108%" }, show: { y: 0 } }}
              transition={{ duration: DUR, ease: EASE }}
            >
              {w}
            </motion.span>
          </span>
          {i < words.length - 1 ? " " : ""}
        </span>
      ))}
    </Tag>
  );
}

/**
 * Section heading on the 12-column grid: a note in the margin (columns 1-2), the headline from column 3 + shift,
 * a huge section number hanging off the left edge of the screen. Everything flush left.
 */
export function SectionHead({
  title,
  lead,
  stacked,
  eyebrow,
  n,
  shift = 0,
}: {
  title: string;
  lead?: React.ReactNode;
  stacked?: boolean;
  eyebrow?: string;
  n?: string;
  shift?: 0 | 1 | 2 | 3;
}) {
  const start = [3, 4, 5, 6][shift];
  return (
    <div className="relative">
      {n && (
        <span
          aria-hidden
          className="sect-num pointer-events-none absolute top-[-0.16em] left-[calc(50%-50vw-0.06em)] -z-0 select-none"
        >
          {n}
        </span>
      )}
      <div className={stacked ? "relative" : "relative lg:grid lg:grid-cols-12 lg:gap-x-6"}>
        {eyebrow && !stacked && (
          <p className="eyebrow mb-4 lg:col-span-2 lg:col-start-1 lg:row-start-1 lg:mb-0 lg:pt-4">
            <Bolt size={13} />
            {eyebrow}
          </p>
        )}
        <div
          className={stacked ? "flex flex-col gap-5" : "flex flex-col gap-5 lg:row-start-1"}
          style={stacked ? undefined : { gridColumn: `${start} / span ${12 - start + 1}`, paddingTop: shift ? `${shift * 14}px` : undefined }}
        >
          {eyebrow && stacked && (
            <p className="eyebrow">
              <Bolt size={13} />
              {eyebrow}
            </p>
          )}
          <Lines text={title} className="h2 max-w-[18ch]" />
          {lead && (
            <Reveal delay={0.1}>
              <p className="lead">{lead}</p>
            </Reveal>
          )}
        </div>
      </div>
    </div>
  );
}

/** Fade + short rise when scrolled into view. Disabled for reduced motion. */
export function Reveal({
  children,
  className,
  delay = 0,
  as = "div",
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  as?: "div" | "li" | "section";
}) {
  const reduce = useReducedMotion();
  const Comp = motion[as];
  return (
    <Comp
      className={className}
      initial={reduce ? false : { opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -60px 0px" }}
      transition={{ duration: DUR, delay, ease: EASE }}
    >
      {children}
    </Comp>
  );
}
