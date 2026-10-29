"use client";

import { Download } from "lucide-react";
import { asset } from "@/lib/asset";
import { SITE } from "@/lib/site";
import { NjIcon } from "./NjIcon";
import { Deal } from "./Deal";
import { Reveal, SectionHead } from "./ui";

/** The deal: six steps on the route, four payments, and the sample contract they are written into. */
export function Process() {
  return (
    <section id="process" className="bg-bg-2 pt-14 pb-14 lg:pt-24 lg:pb-20">
      <div className="mx-auto max-w-[var(--page)] px-5 sm:px-8 lg:px-12 xl:px-20">
        <SectionHead
          title="Паспорт вашей сделки"
          lead="Платите по ходу дела: каждый платёж идёт после результата, который вы видите."
        />

        <Deal />

        <Reveal className="mt-12 rounded-[6px] bg-surface p-6 sm:p-8 lg:mt-16 lg:grid lg:grid-cols-12 lg:gap-x-6 lg:p-10">
          <div className="lg:col-span-12">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-5">
                <NjIcon name="contract" className="size-12 shrink-0 text-accent-ink" />
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
