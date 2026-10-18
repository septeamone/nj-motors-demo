"use client";

import { ArrowUpRight, CheckCircle2, Loader2, TriangleAlert } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { QUIZ } from "@/lib/data";
import { channels, SITE } from "@/lib/site";
import { NjIcon, type IconName } from "./NjIcon";
import { Select } from "./Select";
import { Bolt, Reveal, SectionHead } from "./ui";

type Form = { name: string; contact: string; budget: string; message: string; consent: boolean; body: string; engine: string; age: string };
const F0: Form = { name: "", contact: "", budget: "", message: "", consent: false, body: "", engine: "", age: "" };

// the three optional "what are you looking for" questions (the old separate quiz): body, engine, age
const PREFS = QUIZ.filter((q) => ["body", "engine", "age"].includes(q.key)) as { key: "body" | "engine" | "age"; q: string; options: string[] }[];

const BUDGETS = [
  { value: "", label: "Не определён" },
  { value: "до 2 млн ₽", label: "до 2 млн ₽" },
  { value: "2–3 млн ₽", label: "2–3 млн ₽" },
  { value: "3–5 млн ₽", label: "3–5 млн ₽" },
  { value: "5–8 млн ₽", label: "5–8 млн ₽" },
  { value: "от 8 млн ₽", label: "от 8 млн ₽" },
];
const NEXT = [
  ["Связываемся", "Уточняем задачу, бюджет и сроки."],
  ["Готовим подборку", "Варианты с проверкой и расчётом стоимости по каждому."],
  ["Решаете вы", "Выкупаем автомобиль только после вашего согласия."],
];

function validate(f: Form) {
  const er: Partial<Record<keyof Form, string>> = {};
  if (f.name.trim().length < 2) er.name = "Укажите имя";
  const c = f.contact.trim();
  if (!c) er.contact = "Укажите телефон или эл. почту";
  else if (!(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c) || c.replace(/\D/g, "").length >= 10))
    er.contact = "Телефон с кодом (+7 900 000-00-00) или эл. почта (name@mail.ru)";
  if (!f.consent) er.consent = "Нужно согласие на обработку данных";
  return er;
}

export function Contact() {
  const contacts = channels();
  const [f, setF] = useState<Form>(F0);
  const [errors, setErrors] = useState<Partial<Record<keyof Form, string>>>({});
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Car cards and the calculator can pre-fill the message.
  useEffect(() => {
    const h = (e: Event) => {
      const text = (e as CustomEvent<string>).detail;
      setStatus("idle");
      setF((p) => ({ ...p, message: p.message.trim() ? `${p.message.trim()}
${text}` : text }));
    };
    window.addEventListener("lead-prefill", h);
    return () => {
      window.removeEventListener("lead-prefill", h);
      clearTimeout(timer.current);
    };
  }, []);

  const set = <K extends keyof Form>(k: K, v: Form[K]) => {
    setF((p) => ({ ...p, [k]: v }));
    setErrors((p) => ({ ...p, [k]: undefined }));
  };

  const submit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    const er = validate(f);
    setErrors(er);
    const first = (["name", "contact", "consent"] as const).find((k) => er[k]);
    if (first) {
      document.getElementById(`f-${first}`)?.focus();
      return;
    }
    setStatus("loading");
    const endpoint = SITE.form.endpoint;
    if (!endpoint) {
      // No receiver is connected yet (site.json). Only the local preview pretends to send;
      // a production build says honestly that nothing was delivered. `npm run check:publish` blocks the release.
      if (process.env.NODE_ENV !== "production") timer.current = setTimeout(() => {
          navigator.vibrate?.([20, 60, 35]);
          setStatus("success");
        }, 1200);
      else setStatus("error");
      return;
    }
    try {
      const r = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        signal: AbortSignal.timeout(10000),
        body: JSON.stringify({ ...f, source: "njmotors-landing" }),
      });
      if (!r.ok) throw new Error(String(r.status));
      navigator.vibrate?.([20, 60, 35]);
      setStatus("success");
    } catch {
      setStatus("error");
    }
  };

  return (
    <section id="contact" className="drench halftone relative overflow-hidden py-12 lg:py-16">
      <Bolt size={520} className="pointer-events-none absolute -right-10 -bottom-10 -z-10 hidden rotate-[12deg] text-[#040c14] opacity-[0.12] lg:block" />
      <div className="mx-auto max-w-[var(--page)] px-5 sm:px-8 lg:px-12 xl:px-20">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16">
          <div>
            <SectionHead
              stacked
              eyebrow="Заявка" n="07"
              title="Расскажите, какую машину ищете"
              lead="Опишите задачу, пришлём подборку и расчёт."
            />
            <Reveal delay={0.1} className="mt-10">
              <ol className="grid gap-5 border-t border-line pt-8">
                {NEXT.map(([t, d], i) => (
                  <li key={t} className="flex gap-4">
                    <span className="num w-8 shrink-0 text-[26px] leading-none text-accent-ink">
                      0{i + 1}
                    </span>
                    <span>
                      <span className="block text-[15.5px] font-bold text-ink">{t}</span>
                      <span className="block text-[16px] text-ink-2">{d}</span>
                    </span>
                  </li>
                ))}
              </ol>
              {contacts.length > 0 && (
                <ul className="mt-8 flex flex-wrap gap-3">
                  {contacts.map((c) => {
                    const Icon = { phone: "phone", telegram: "plane", whatsapp: "message", email: "mail", address: "pin" }[c.key] as IconName;
                    const cls = "btn btn-ghost btn-sm";
                    return (
                      <li key={c.key}>
                        {c.href ? (
                          <a href={c.href} className={cls}>
                            <NjIcon name={Icon} className="size-5" /> {c.value}
                          </a>
                        ) : (
                          <span className={`${cls} cursor-default`}>
                            <NjIcon name={Icon} className="size-5" /> {c.value}
                          </span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </Reveal>
          </div>

          <Reveal delay={0.08}>
            <div className="plate overflow-hidden p-6 sm:p-9">
              <AnimatePresence mode="wait" initial={false}>
                {status === "success" ? (
                  <motion.div
                    key="ok"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="grid place-items-center py-14 text-center"
                    role="status"
                  >
                    <CheckCircle2 className="size-14 text-[var(--ok)]" strokeWidth={1.25} />
                    <p className="font-display mt-6 text-[26px] tracking-wide uppercase text-ink">Заявка принята</p>
                    <p className="mt-3 max-w-[40ch] text-[16px] text-ink-2">
                      Менеджер свяжется с вами и уточнит детали.
                    </p>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm mt-8"
                      onClick={() => {
                        setF(F0);
                        setStatus("idle");
                      }}
                    >
                      Отправить ещё одну
                    </button>
                  </motion.div>
                ) : (
                  <motion.form key="form" onSubmit={submit} noValidate exit={{ opacity: 0 }} className="grid gap-5">
                    <div className="grid gap-5 sm:grid-cols-2">
                      <div>
                        <label htmlFor="f-name" className="label">
                          Имя
                        </label>
                        <div className="field" data-invalid={!!errors.name}>
                          <input
                            id="f-name"
                            autoComplete="name"
                            value={f.name}
                            onChange={(e) => set("name", e.target.value)}
                            placeholder="Как к вам обращаться"
                            aria-invalid={!!errors.name}
                            aria-describedby={errors.name ? "f-name-err" : undefined}
                          />
                        </div>
                        {errors.name && <p id="f-name-err" role="alert" className="mt-2 text-[16px] text-[var(--danger)]">{errors.name}</p>}
                      </div>
                      <div>
                        <label htmlFor="f-contact" className="label">
                          Телефон или эл. почта
                        </label>
                        <div className="field" data-invalid={!!errors.contact}>
                          <input
                            id="f-contact"
                            autoComplete="tel email"
                            value={f.contact}
                            onChange={(e) => set("contact", e.target.value)}
                            placeholder="+7 900 000-00-00"
                            aria-invalid={!!errors.contact}
                            aria-describedby={errors.contact ? "f-contact-err" : undefined}
                          />
                        </div>
                        {errors.contact && <p id="f-contact-err" role="alert" className="mt-2 text-[16px] text-[var(--danger)]">{errors.contact}</p>}
                      </div>
                      <div className="sm:col-span-2">
                        <label htmlFor="f-budget" className="label">Бюджет</label>
                        <Select id="f-budget" aria-label="Бюджет" value={f.budget} onChange={(v) => set("budget", v)} options={BUDGETS} />
                      </div>
                    </div>
                    <div className="grid gap-4 border-t border-line pt-5">
                      <p className="label">
                        Что ищете <span className="font-medium text-ink-3">· по желанию, поможет подобрать быстрее</span>
                      </p>
                      {PREFS.map((q) => (
                        <div key={q.key} role="radiogroup" aria-label={q.q} className="flex flex-wrap gap-2">
                          {q.options.map((o) => (
                            <button
                              key={o}
                              type="button"
                              role="radio"
                              aria-checked={f[q.key] === o}
                              onClick={() => set(q.key, f[q.key] === o ? "" : o)}
                              className="cursor-pointer rounded-full border border-line-strong px-3.5 py-1.5 text-[16px] font-bold text-ink-2 transition-colors hover:border-accent hover:text-ink aria-checked:border-accent aria-checked:bg-accent-soft aria-checked:text-ink"
                            >
                              {o}
                            </button>
                          ))}
                        </div>
                      ))}
                    </div>
                    <div>
                      <label htmlFor="f-msg" className="label">
                        Сообщение <span className="font-medium text-ink-3">· необязательно</span>
                      </label>
                      <div className="field field-area">
                        <textarea
                          id="f-msg"
                          rows={4}
                          value={f.message}
                          onChange={(e) => set("message", e.target.value)}
                          placeholder="Модель, комплектация, цвет, сроки — всё, что важно"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="flex cursor-pointer items-start gap-3 text-[16px] leading-snug text-ink-2">
                        <input
                          id="f-consent"
                          type="checkbox"
                          aria-invalid={!!errors.consent}
                          aria-describedby={errors.consent ? "f-consent-err" : undefined}
                          checked={f.consent}
                          onChange={(e) => set("consent", e.target.checked)}
                          className="mt-0.5 size-[18px] shrink-0 cursor-pointer accent-[var(--accent)]"
                        />
                        <span>Согласен на обработку персональных данных и с политикой конфиденциальности</span>
                      </label>
                      {errors.consent && <p id="f-consent-err" role="alert" className="mt-2 text-[16px] text-[var(--danger)]">{errors.consent}</p>}
                    </div>
                    {status === "error" && (
                      <p role="alert" className="flex gap-3 rounded-[4px] border border-[var(--danger)] p-4 text-[16px] leading-snug text-ink">
                        <TriangleAlert className="mt-0.5 size-4 shrink-0 text-[var(--danger)]" strokeWidth={1.75} />
                        {SITE.form.endpoint ? "Не получилось отправить заявку. Проверьте соединение и попробуйте ещё раз" : "Заявка не отправлена: приём заявок ещё не подключён"}{contacts.length ? " или свяжитесь с нами напрямую" : ""}.
                      </p>
                    )}
                    <button type="submit" disabled={status === "loading"} className="btn btn-primary h-14 w-full">
                      {status === "loading" ? (
                        <>
                          <Loader2 className="size-[18px] animate-spin" strokeWidth={2} /> Отправляем
                        </>
                      ) : (
                        <>
                          Отправить заявку
                          <ArrowUpRight className="size-[18px]" strokeWidth={2} />
                        </>
                      )}
                    </button>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

