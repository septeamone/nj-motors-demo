"use client";

import { motion, useScroll, useTransform } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { Check } from "lucide-react";
import { DOCS, PROMISES, TERMS } from "@/lib/data";
import { nb } from "@/lib/typo";
import { NjIcon } from "./NjIcon";
import { WriteUs } from "./LeadBits";
import { Deal } from "./Deal";
import { FilmCanvas } from "./FilmCanvas";
import { Reveal, SectionHead } from "./ui";

const clamp = (v: number) => Math.min(1, Math.max(0, v));

/**
 * The deal: six steps on the route, four payments, and the sample contract they are written into.
 * The whole section stands on the sea: the open-water part of a film made with Higgsfield (frames 61–91 of the old
 * porthole clip, without the porthole), played by the scroll, comes up out of the dark while the heading rises, and then the sea
 * dims into the section's ground and stays behind the route, the pages and the payments.
 */
export function Process() {
  const sec = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sec,
    offset: ["start start", "end start"],
  });
  // how many screens deep into the section the visitor is; the height is kept, not read every frame (reading it
  // there made the browser lay the page out again on each scroll frame)
  const secH = useRef(0);
  useEffect(() => {
    const el = sec.current;
    if (!el) return;
    const ro = new ResizeObserver(() => (secH.current = el.offsetHeight));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const depth = (v: number) =>
    typeof window === "undefined"
      ? 0
      : (v * (secH.current || (sec.current?.offsetHeight ?? 0))) / innerHeight;
  // The sea film comes up out of the page (feathered edges) and fills the screen while the section rises;
  // the waves and the car carrier move with the scroll, the heading already rising over them
  // (the film has no empty screens of its own), and then the sea dims under the route, the pages and the payments.
  const { scrollYProgress: rise } = useScroll({ target: sec, offset: ["start end", "start start"] });
  // how far the visitor has come: 0 when the section appears at the bottom, 1 when it reaches the top, then deeper
  const way = (e: number, v: number) => e + depth(v);
  const film = useTransform([rise, scrollYProgress], ([e, v]: number[]) => clamp((way(e, v) - 0.25) / 1.1));
  const dim = useTransform([rise, scrollYProgress], ([e, v]: number[]) => 0.12 + clamp((way(e, v) - 1.2) / 0.4) * 0.74);
  // no hard edge: the picture comes up out of the page's dark ground, feathered at the top and the sides, and the
  // feathering melts away as the section reaches the top
  const fade = useTransform(rise, (e) => {
    const f = 1 - e;
    return `linear-gradient(to bottom, transparent 0, #000 ${f * 55}vh), linear-gradient(to right, transparent 0, #000 ${f * 14}vw, #000 calc(100% - ${f * 14}vw), transparent 100%)`;
  });
  // reduced motion: the picture keeps its size (read after mount, so the server and the first client render agree)
  const [calm, setCalm] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCalm(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);
  const lens = useTransform([rise, scrollYProgress], ([e, v]: number[]) => (calm ? "none" : `scale(${1.12 - 0.12 * e + 0.08 * clamp(depth(v) / 4)})`));

  return (
    <section ref={sec} id="process" className="relative bg-bg pb-10 lg:pb-16">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <motion.div style={{ maskImage: fade, WebkitMaskImage: fade, maskComposite: "intersect", WebkitMaskComposite: "source-in" }} className="sticky top-0 h-svh overflow-hidden bg-bg">
          <motion.div style={{ transform: lens }} className="absolute inset-0 will-change-transform">
            <FilmCanvas name="sea" count={31} progress={film} />
          </motion.div>
          <motion.span
            style={{ opacity: dim }}
            className="absolute inset-0 bg-bg-2"
          />
        </motion.div>
      </div>
      <div aria-hidden className="h-[45svh]" />
      <div className="relative mx-auto max-w-[var(--page)] px-5 sm:px-8 lg:px-12 xl:px-20">
        {/* the heading on a frosted glass plate: the bright sky of the film stays visible around it, the words stay crisp */}
        <div data-theme="dark" className="on-film glass-plate relative max-w-[980px] rounded-[28px] p-5 sm:rounded-[20px] sm:p-8 lg:p-10">
          <div className="relative">
            <SectionHead
              title="Процесс"
              lead="4 договора с привязкой к конкретному этапу, весь необходимый пакет документов и ведение под ключ."
            />
            {/* the terms: one number, then the two legs of the way */}
            <Reveal className="mt-6 lg:mt-8">
              <div className="adv-tile grid max-w-[860px] overflow-hidden rounded-[8px] sm:rounded-[10px] bg-[var(--paper)] text-[var(--paper-ink)] sm:grid-cols-[auto_minmax(0,1fr)]">
                <div className="flex items-center gap-4 bg-[var(--paper-ink)] px-5 py-4 text-[var(--paper)] sm:flex-col sm:items-start sm:justify-center sm:gap-2 sm:px-7 sm:py-6">
                  <NjIcon name="clock" className="size-9 shrink-0 sm:size-10" />
                  <p className="leading-none">
                    <span className="num block text-[clamp(2.375rem,4.2vw,3.375rem)] leading-none">{TERMS.days}</span>
                    <span className="mt-1.5 block text-body leading-none font-bold">дней под ключ</span>
                  </p>
                </div>
                <ol className="grid divide-y divide-[rgba(18,16,13,0.16)] sm:grid-cols-2 sm:divide-x sm:divide-y-0">
                  {TERMS.legs.map((l, k) => (
                    <li key={k} className="flex gap-3 px-5 py-4 sm:block sm:px-7 sm:py-6">
                      <span className="font-display shrink-0 text-[clamp(1.375rem,2.2vw,1.875rem)] leading-none tracking-title uppercase">{l.t}</span>
                      <span className="block text-body leading-body sm:mt-2 sm:text-body-lg">{l.d}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </Reveal>
          </div>
        </div>

        <Deal />

        {/* guarantees: the three promises on kraft first, then every paper the buyer holds, each one on its own */}
        <div className="mt-12 lg:mt-16">
          <Reveal className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between lg:gap-10">
            <h3 className="font-display text-[clamp(1.875rem,3.4vw,2.875rem)] leading-[1.1] tracking-title uppercase">Гарантии</h3>
          </Reveal>
          <Reveal className="mt-6 grid gap-3 sm:grid-cols-3 lg:gap-4">
            {PROMISES.map((g) => (
              <div key={g.t} className="adv-tile flex gap-4 rounded-[10px] bg-[var(--paper)] p-5 text-[var(--paper-ink)] sm:flex-col sm:gap-3 lg:p-6">
                <span className="grid size-11 shrink-0 place-items-center rounded-full bg-[var(--accent-fill)] text-white">
                  <Check className="size-6" strokeWidth={2.5} nonScalingStroke />
                </span>
                <div>
                  <p className="font-display text-[clamp(1.3125rem,1.9vw,1.625rem)] leading-tight tracking-title uppercase">{g.t}</p>
                  <p className="mt-1.5 text-body leading-body opacity-85">{nb(g.d)}</p>
                </div>
              </div>
            ))}
          </Reveal>
          <Reveal className="mt-3 rounded-[10px] bg-surface p-5 sm:p-7 lg:mt-4 lg:p-9">
            <ul className="grid gap-2.5 sm:grid-cols-2 lg:gap-3">
              {DOCS.map((d) => (
                <li key={d} className="flex items-start gap-3 rounded-[4px] bg-surface-2 px-4 sm:rounded-[8px] py-3.5 text-body leading-snug font-bold text-ink">
                  <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full border-2 border-[var(--accent-fill)] text-accent-ink">
                    <Check className="size-3.5" strokeWidth={2.5} nonScalingStroke />
                  </span>
                  {nb(d)}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>

        {/* the most reassuring moment of the page ends with the action: one message is enough */}
        <Reveal className="mt-10 grid items-center gap-6 rounded-[6px] bg-surface p-6 sm:p-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-12 lg:p-10">
          <div>
            <p className="font-display text-[clamp(1.5rem,2.6vw,2.125rem)] leading-tight tracking-title text-ink uppercase">Бесплатная консультация</p>
            <p className="mt-2 max-w-[40ch] text-body-lg leading-body text-ink-2">{nb("Пришлём варианты с расчётом «под ключ», фотографиями и описанием.")}</p>
          </div>
          <WriteUs />
        </Reveal>
      </div>
    </section>
  );
}
