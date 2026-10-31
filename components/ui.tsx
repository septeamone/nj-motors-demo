"use client";

import { nb } from "@/lib/typo";
import { motion, useReducedMotion } from "motion/react";
import Image from "next/image";
import { asset } from "@/lib/asset";
import { DUR, EASE } from "@/lib/motion";

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
          <span className="mono mt-1 hidden text-ink-3 sm:block">Автомобили из Кореи с 2023 года</span>
        )}
      </span>
    </span>
  );
}

/** A section heading (plain: the paint-spray reveal was dropped to keep the page calm and the text clean for search). */
export function Lines({ text, className, as = "h2" }: { text: string; className?: string; as?: "h1" | "h2" | "h3" | "p" }) {
  const Tag = as;
  return <Tag className={className}>{text}</Tag>;
}

/** Section heading: the headline, flush left on the page grid, with its lead sentence underneath. */
export function SectionHead({ title, lead, stacked }: { title: string; lead?: React.ReactNode; stacked?: boolean }) {
  return (
    <div className={`flex flex-col gap-5 ${stacked ? "" : "lg:max-w-[calc(100%*10/12)]"}`}>
      <Lines text={title} className="h2 max-w-[18ch]" />
      {lead && (
        <Reveal delay={0.1}>
          <p className="lead">{typeof lead === "string" ? nb(lead) : lead}</p>
        </Reveal>
      )}
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
