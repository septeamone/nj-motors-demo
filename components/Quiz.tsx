"use client";

import { ArrowLeft } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useState } from "react";
import { QUIZ } from "@/lib/data";
import { DUR, EASE } from "@/lib/motion";
import { WriteUs } from "./LeadBits";

/**
 * A choice in four taps (budget, body, engine, age), then a message: the soft way in for a visitor who does not know
 * what to write. Each answer moves on by itself; the answers become a ready-made message. No discounts for answering.
 */
// what each answer is about, so "Не важно" in the message says what is not important
const ABOUT: Record<string, string> = { budget: "Бюджет", body: "Кузов", engine: "Двигатель", age: "Возраст" };

export function Quiz() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const calm = useReducedMotion();
  const done = step >= QUIZ.length;
  const q = QUIZ[Math.min(step, QUIZ.length - 1)];

  const said = QUIZ.filter((x) => answers[x.key]).map((x) => `${ABOUT[x.key]}: ${answers[x.key].toLowerCase()}`);

  const pick = (o: string) => {
    setAnswers((a) => ({ ...a, [q.key]: o }));
    setStep((s) => s + 1);
  };

  return (
    <div className="plate p-6 sm:p-8">
      <div className="flex items-center justify-between gap-4">
        <p className="font-display text-[clamp(22px,2.2vw,30px)] leading-tight tracking-wide uppercase">Подберём под вашу задачу</p>
        <p className="num shrink-0 text-[15px] text-ink-3" aria-live="polite">
          {done ? "Готово" : `${step + 1} из ${QUIZ.length}`}
        </p>
      </div>
      {/* progress: one segment per question */}
      <div aria-hidden className="mt-4 flex gap-1.5">
        {QUIZ.map((x, i) => (
          <span key={x.key} className={`h-1 flex-1 rounded-full transition-colors duration-300 ${i < step ? "bg-accent" : "bg-line-strong"}`} />
        ))}
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={done ? "end" : q.key}
          initial={calm ? false : { opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0, transition: { duration: DUR * 0.6, ease: EASE } }}
          exit={calm ? undefined : { opacity: 0, x: -24, transition: { duration: 0.18 } }}
          className="mt-6"
        >
          {done ? (
            <>
              <p className="text-[18px] leading-snug font-bold text-ink">Напишите нам — пришлём 2–3 варианта под ваш бюджет с расчётом под ключ.</p>
              <WriteUs className="mt-5" text={["Здравствуйте! Подберите, пожалуйста, машину из Кореи.", ...said].join("\n")} />
            </>
          ) : (
            <div role="radiogroup" aria-label={q.q}>
              <p className="text-[18px] font-bold text-ink">{q.q}</p>
              {q.hint && <p className="mt-1 text-[15px] text-ink-3">{q.hint}</p>}
              <div className="mt-4 flex flex-wrap gap-2">
                {q.options.map((o) => (
                  <button
                    key={o}
                    type="button"
                    role="radio"
                    aria-checked={answers[q.key] === o}
                    onClick={() => pick(o)}
                    className="min-h-11 cursor-pointer rounded-full border border-line-strong px-4 text-[16px] font-bold text-ink-2 transition-[color,background-color,border-color] duration-150 hover:border-accent hover:text-ink aria-checked:border-accent aria-checked:bg-accent-soft aria-checked:text-ink"
                  >
                    {o}
                  </button>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {step > 0 && (
        <button type="button" onClick={() => setStep((s) => s - 1)} className="mt-5 inline-flex min-h-11 cursor-pointer items-center gap-2 text-[15px] font-bold text-ink-2 hover:text-ink">
          <ArrowLeft className="size-4" strokeWidth={2} />
          Назад
        </button>
      )}
    </div>
  );
}
