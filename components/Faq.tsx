"use client";

import * as Accordion from "@radix-ui/react-accordion";
import { Plus } from "lucide-react";
import { FAQ } from "@/lib/data";
import { nb } from "@/lib/typo";
import { Reveal, SectionHead } from "./ui";

export function Faq() {
  return (
    <section id="faq" className="border-t-[3px] border-line-strong pt-14 pb-16 lg:pt-20 lg:pb-24">
      <div className="mx-auto max-w-[var(--page)] px-5 sm:px-8 lg:px-12 xl:px-20">
        <SectionHead eyebrow="Вопросы" n="06" shift={2} title="Вопросы до заявки" />
        <Reveal className="mt-8 lg:mt-10">
          <Accordion.Root type="single" collapsible defaultValue="item-0" className="grid items-start gap-x-12 border-t border-line-strong lg:grid-cols-2">
            {FAQ.map((f, i) => (
              <Accordion.Item key={f.q} value={`item-${i}`} className="border-b border-line">
                <Accordion.Header>
                  <Accordion.Trigger className="group flex w-full items-center justify-between gap-6 py-5 text-left text-[17px] font-bold text-ink transition-colors hover:text-accent-ink">
                    {nb(f.q)}
                    <span className="grid size-10 shrink-0 place-items-center rounded-full border border-line-strong transition-transform duration-300 group-data-[state=open]:rotate-45 group-data-[state=open]:border-accent group-data-[state=open]:text-accent-ink">
                      <Plus className="size-[18px] text-accent" strokeWidth={2} />
                    </span>
                  </Accordion.Trigger>
                </Accordion.Header>
                <Accordion.Content className="overflow-hidden data-[state=closed]:animate-[acc-up_260ms_ease-out] data-[state=open]:animate-[acc-down_320ms_cubic-bezier(.2,0,0,1)]">
                  <p className="max-w-[62ch] pb-7 text-[16px] leading-relaxed text-ink-2">{nb(f.a)}</p>
                </Accordion.Content>
              </Accordion.Item>
            ))}
          </Accordion.Root>
        </Reveal>
      </div>
    </section>
  );
}
