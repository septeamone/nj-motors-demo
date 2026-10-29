"use client";

import { ArrowRight, Download } from "lucide-react";
import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";
import { asset } from "@/lib/asset";
import { SITE } from "@/lib/site";
import { NjIcon } from "./NjIcon";
import { Deal } from "./Deal";
import { FilmCanvas } from "./FilmCanvas";
import { Reveal, SectionHead } from "./ui";

const clamp = (v: number) => Math.min(1, Math.max(0, v));

/**
 * The deal: six steps on the route, four payments, and the sample contract they are written into.
 * The whole section stands on the sea: it opens in a ship's cabin, the camera goes out through the porthole
 * (a film made with Higgsfield, played by the scroll), the heading arrives over the open water, and then the sea
 * dims into the section's ground and stays behind the route, the pages and the payments.
 */
export function Process() {
  const sec = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sec,
    offset: ["start start", "end start"],
  });
  // how many screens deep into the section the visitor is
  const depth = (v: number) =>
    typeof window === "undefined"
      ? 0
      : (v * (sec.current?.offsetHeight ?? 0)) / innerHeight;
  const film = useTransform(scrollYProgress, (v) => clamp(depth(v) / 1.3));
  const dim = useTransform(
    scrollYProgress,
    (v) => clamp((depth(v) - 0.8) / 0.55) * 0.86,
  );
  // The film comes in as a rounded window in the page that opens to the whole screen while the section rises
  // (the picture never arrives as a hard-edged block), and afterwards the sea keeps drifting slowly under the shade.
  const { scrollYProgress: rise } = useScroll({ target: sec, offset: ["start end", "start start"] });
  const clip = useTransform(rise, (e) => `inset(${(1 - e) * 6}vh ${(1 - e) * 7}vw round ${(1 - e) * 36}px)`);
  const lens = useTransform([rise, scrollYProgress], ([e, v]: number[]) => `scale(${1.12 - 0.12 * e + 0.08 * clamp((depth(v) - 1.3) / 4)})`);

  return (
    <section ref={sec} id="process" className="relative bg-bg pb-14 lg:pb-20">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <motion.div style={{ clipPath: clip }} className="sticky top-0 h-svh overflow-hidden bg-[#05080c]">
          <motion.div style={{ transform: lens }} className="absolute inset-0 will-change-transform">
            <FilmCanvas name="porthole" count={91} progress={film} />
          </motion.div>
          <motion.span
            style={{ opacity: dim }}
            className="absolute inset-0 bg-bg-2"
          />
        </motion.div>
      </div>
      {/* first the camera goes out through the porthole; the heading arrives over the open sea */}
      <div aria-hidden className="h-[150svh]" />
      <div className="relative mx-auto max-w-[var(--page)] px-5 sm:px-8 lg:px-12 xl:px-20">
        <div className="on-film">
          <SectionHead
            title="Паспорт вашей сделки"
            lead="Четыре платежа по этапам сделки. За что и когда вы платите, записано в договоре до первого платежа."
          />
        </div>

        <Deal />

        <Reveal className="mt-12 rounded-[6px] bg-surface p-6 sm:p-8 lg:mt-16 lg:grid lg:grid-cols-12 lg:gap-x-6 lg:p-10">
          <div className="lg:col-span-12">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-5">
                <NjIcon
                  name="contract"
                  className="size-12 shrink-0 text-accent-ink"
                />
                <div>
                  <p className="font-display text-[clamp(26px,3vw,36px)] leading-tight tracking-wide uppercase">
                    Образец договора
                  </p>
                  <p className="mt-2 max-w-[48ch] text-[18px] leading-snug text-ink-2">
                    Этапы оплаты, сроки, возврат аванса, приёмка. Образец без
                    сумм и подписей.
                  </p>
                </div>
              </div>
              <a
                href={asset("/docs/NJ-Motors-dogovor-obrazec.pdf")}
                download
                className="btn btn-primary shrink-0 self-start sm:self-center"
              >
                <Download className="size-[18px]" strokeWidth={2} />
                Скачать PDF
              </a>
            </div>
            <p className="mt-6 max-w-[62ch] text-[16px] leading-snug text-ink-3">
              Суммы и сроки вписываются в договор
              {SITE.dealConfirmed ? "" : ". Этапы на сайте пока уточняются с владельцем"}
              .
            </p>
          </div>
        </Reveal>

        {/* the most reassuring moment of the page ends with the action */}
        <Reveal className="mt-10 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:gap-6">
          <a href="#contact" className="btn btn-primary">
            Оставить заявку
            <ArrowRight className="size-[18px]" strokeWidth={2} />
          </a>
          <p className="text-[17px] font-medium text-ink">Первый шаг бесплатный: платить пока не нужно.</p>
        </Reveal>
      </div>
    </section>
  );
}
