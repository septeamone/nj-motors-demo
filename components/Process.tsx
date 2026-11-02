"use client";

import { motion, useScroll, useTransform } from "motion/react";
import { useEffect, useRef } from "react";
import { DOCS } from "@/lib/data";
import { NjIcon } from "./NjIcon";
import { QuickLead } from "./QuickLead";
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
  const lens = useTransform([rise, scrollYProgress], ([e, v]: number[]) => `scale(${1.12 - 0.12 * e + 0.08 * clamp(depth(v) / 4)})`);

  return (
    <section ref={sec} id="process" className="relative bg-bg pb-14 lg:pb-20">
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
        <div className="on-film">
          <SectionHead
            title="Паспорт вашей сделки"
            lead="Пять официальных платежей по этапам. За что и когда вы платите, записано в договоре."
          />
        </div>

        <Deal />

        <Reveal className="mt-12 rounded-[6px] bg-surface p-6 sm:p-8 lg:mt-16 lg:grid lg:grid-cols-12 lg:gap-x-6 lg:p-10">
          <div className="lg:col-span-12">
            {/* what the buyer holds at the end (from Andrey's own description) */}
            <div className="flex items-start gap-5">
              <NjIcon name="contract" className="size-12 shrink-0 text-ink" />
              <div className="min-w-0">
                <p className="font-display text-[clamp(26px,3vw,36px)] leading-tight tracking-wide uppercase">Документы на ваше имя</p>
                <p className="mt-2 max-w-[52ch] text-[17px] leading-snug text-ink-2">Всё официально: на руках у вас будет полный комплект.</p>
              </div>
            </div>
            <ol className="mt-6 grid gap-x-10 gap-y-2.5 sm:grid-cols-2">
              {DOCS.map((d, k) => (
                <li key={d} className="flex gap-3 text-[16px] leading-snug text-ink">
                  <span className="num w-6 shrink-0 text-accent-ink">{k + 1}</span>
                  {d}
                </li>
              ))}
            </ol>
            <p className="mt-6 max-w-[62ch] text-[16px] leading-snug text-ink-3">
              Для постановки на учёт останется распечатать ЭПТС и ТПО, пройти техосмотр и оформить страховку.
            </p>
          </div>
        </Reveal>

        {/* the most reassuring moment of the page ends with the action: a phone is enough */}
        <Reveal className="mt-10 grid items-center gap-6 rounded-[6px] bg-surface p-6 sm:p-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-12 lg:p-10">
          <div>
            <p className="font-display text-[clamp(24px,2.6vw,34px)] leading-tight tracking-wide text-ink uppercase">Первый шаг бесплатный</p>
            <p className="mt-2 max-w-[40ch] text-[17px] leading-snug text-ink-2">Оставьте телефон: Андрей свяжется, расспросит о задаче и пришлёт расчёт. Платить пока не нужно.</p>
          </div>
          <QuickLead form="deal" />
        </Reveal>
      </div>
    </section>
  );
}
