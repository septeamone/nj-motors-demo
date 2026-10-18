"use client";

import { Download } from "lucide-react";
import { asset } from "@/lib/asset";
import { SITE } from "@/lib/site";
import { NjIcon } from "./NjIcon";
import { Passport } from "./Passport";
import { Route } from "./Route";
import { Reveal, SectionHead } from "./ui";

/** One list: six steps, and on four of them the payment that belongs to that step. */
export function Process() {
  return (
    <section id="process" className="halftone border-t-[6px] border-accent bg-bg-2 pt-8 pb-10 lg:pt-12 lg:pb-16" style={{ ["--ht-dir" as string]: "80deg" }}>
      <div className="mx-auto max-w-[var(--page)] px-5 sm:px-8 lg:px-12 xl:px-20">
        <SectionHead
          eyebrow="Сделка" n="03" shift={1}
          title="Паспорт вашей сделки"
          lead="Платите по ходу дела: каждый платёж идёт после результата, который вы видите."
        />

        <Route />

        <Passport />

        <Reveal className="mt-4 border-t border-line-strong pt-8 lg:grid lg:grid-cols-12 lg:gap-x-6 lg:pt-10">
          <p className="eyebrow mb-4 lg:col-span-2 lg:mb-0 lg:pt-2">Документ</p>
          <div className="lg:col-span-10">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-5">
                <span className="grid size-14 shrink-0 place-items-center rounded-[4px] border border-line-strong text-accent-ink">
                  <NjIcon name="contract" className="size-8" />
                </span>
                <div>
                  <p className="font-display text-[clamp(26px,3vw,36px)] leading-tight tracking-wide uppercase">Образец договора</p>
                  <p className="mt-2 max-w-[48ch] text-[18px] leading-snug text-ink-2">Этапы оплаты, сроки, возврат аванса, приёмка. Образец без сумм и подписей.</p>
                </div>
              </div>
              <a href={asset("/docs/NJ-Motors-dogovor-obrazec.pdf")} download className="btn btn-primary shrink-0 self-start sm:self-center">
                <Download className="size-[18px]" strokeWidth={2} />
                Скачать PDF
              </a>
            </div>
            <p className="mt-6 max-w-[62ch] text-[16px] leading-snug text-ink-3">
              Суммы и сроки вписываются в договор{SITE.dealConfirmed ? "" : ". Порядок этапов взят из договоров других импортёров"}.
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
