"use client";

import { ChevronDown } from "lucide-react";
import { useId, useState } from "react";
import { FAQ as BASE, IF_CASES } from "@/lib/data";
import { nb } from "@/lib/typo";
import { Reveal, SectionHead } from "./ui";

// the owner's "what if" commitments join the questions once they are filled in (lib/data)
const FAQ = [...BASE, ...IF_CASES.filter((x) => x.a.trim())];

/**
 * Questions as a stack of slips: the open one becomes a kraft page (the paper of the deal passport, with the red
 * plate printed a hair off underneath), and its answer slides out from under the question. The height opens through
 * grid rows (0fr → 1fr), so it eases both ways with no measuring; every answer stays in the HTML for search engines.
 * One open at a time; a second click closes it.
 */
export function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  const base = useId();
  return (
    <section id="faq" className="pt-10 pb-10 lg:pt-16 lg:pb-16">
      <div className="mx-auto max-w-[var(--page)] px-5 sm:px-8 lg:px-12 xl:px-20">
        <SectionHead title="Ответы на вопросы" />
        <Reveal className="mt-8 lg:mt-10">
          {/* two independent columns on wide screens (an open slip lengthens only its own column), one list on phones */}
          <div className="grid items-start gap-x-8 gap-y-2 lg:grid-cols-2">
            {[0, 1].map((col) => (
              <ul key={col} className="flex flex-col gap-2 max-lg:contents">
                {FAQ.map((f, i) => {
                  if (i % 2 !== col) return null;
                  const on = open === i;
                  const id = `${base}-${i}`;
                  return (
                    <li key={f.q} data-open={on || undefined} className="faq-slip" style={{ order: i }}>
                      <h3>
                        <button
                          type="button"
                          id={`${id}-q`}
                          aria-expanded={on}
                          aria-controls={`${id}-a`}
                          onClick={() => setOpen(on ? null : i)}
                          className="faq-q group flex w-full cursor-pointer items-center justify-between gap-5 px-4 py-4 text-left text-[17px] font-bold sm:px-5"
                        >
                          <span>{nb(f.q)}</span>
                          <ChevronDown aria-hidden className="faq-chev size-5 shrink-0" strokeWidth={2.4} />
                        </button>
                      </h3>
                      <div id={`${id}-a`} role="region" aria-labelledby={`${id}-q`} className="faq-a">
                        <div className="faq-a-in">
                          <p className="px-4 pb-5 text-[16px] leading-relaxed sm:px-5 sm:pr-12">{nb(f.a)}</p>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
