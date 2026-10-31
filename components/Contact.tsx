"use client";

import { ArrowUpRight, CheckCircle2, Loader2, Plus, TriangleAlert } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion, useScroll, useSpring, useTransform } from "motion/react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { asset } from "@/lib/asset";
import { QUIZ } from "@/lib/data";
import { phoneOk, sendError, sendLead, type Via } from "@/lib/lead";
import { DUR, EASE } from "@/lib/motion";
import { channels } from "@/lib/site";
import { ViaPicker } from "./LeadBits";
import { NjIcon, type IconName } from "./NjIcon";
import { Select } from "./Select";
import { Reveal, SectionHead } from "./ui";

type Form = { name: string; contact: string; via: Via; budget: string; message: string; consent: boolean; body: string; engine: string; age: string };
const F0: Form = { name: "", contact: "", via: "Звонок", budget: "", message: "", consent: false, body: "", engine: "", age: "" };

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

function validate(f: Form) {
  const er: Partial<Record<keyof Form, string>> = {};
  if (f.name.trim().length < 2) er.name = "Укажите имя";
  if (!f.contact.trim()) er.contact = "Укажите телефон";
  else if (!phoneOk(f.contact)) er.contact = "Телефон с кодом: +7 900 000-00-00";
  if (!f.consent) er.consent = "Нужно согласие на обработку данных";
  return er;
}

export function Contact() {
  const contacts = channels();
  const [f, setF] = useState<Form>(F0);
  const [errors, setErrors] = useState<Partial<Record<keyof Form, string>>>({});
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  // the optional part (budget, wishes, message) stays folded; a pre-filled message unfolds it
  const [wish, setWish] = useState(false);

  // Car cards and the calculator can pre-fill the message.
  useEffect(() => {
    const h = (e: Event) => {
      const text = (e as CustomEvent<string>).detail;
      setStatus("idle");
      setWish(true);
      setF((p) => ({ ...p, message: p.message.trim() ? `${p.message.trim()}\n${text}` : text }));
    };
    window.addEventListener("lead-prefill", h);
    return () => window.removeEventListener("lead-prefill", h);
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
    setStatus(await sendLead({ ...f, form: "main" }));
  };

  const sec = useRef<HTMLElement>(null);
  const calm = useReducedMotion();
  // two red flaps close in from the sides as the section arrives, and stay shut
  const { scrollYProgress } = useScroll({ target: sec, offset: ["start end", "start 55%"] });
  const closed = useSpring(scrollYProgress, { stiffness: 120, damping: 26, mass: 0.4 });
  const leftX = useTransform(closed, [0, 1], ["-101%", "0%"]);
  const rightX = useTransform(closed, [0, 1], ["101%", "0%"]);
  const rise = useTransform(closed, [0.4, 0.95], [0, 1]);
  // the two columns come in with the flaps: the text from the left, the form plate from the right
  const textX = useTransform(closed, [0, 1], ["-34%", "0%"]);
  const plateX = useTransform(closed, [0, 1], ["34%", "0%"]);

  return (
    <section ref={sec} id="contact" className="drench relative isolate overflow-hidden !bg-transparent py-12 lg:py-16">
      <motion.span aria-hidden style={calm ? undefined : { x: leftX }} className="halftone !absolute inset-y-0 left-0 -z-10 w-[51%] bg-accent-fill" />
      <motion.span aria-hidden style={calm ? undefined : { x: rightX }} className="halftone !absolute inset-y-0 right-0 -z-10 w-[51%] bg-accent-fill" />
      <motion.div style={calm ? undefined : { opacity: rise }} className="mx-auto max-w-[var(--page)] px-5 sm:px-8 lg:px-12 xl:px-20">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16">
          <motion.div style={calm ? undefined : { x: textX }}>
            <SectionHead
              stacked
              title="Расскажите, какую машину ищете"
              lead="Опишите задачу: Андрей пришлёт подборку и расчёт. Платить пока ничего не нужно."
            />
            <Reveal delay={0.1} className="mt-8">
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
              {/* the brand's muscle car poster, keyed out of its own red so it stands straight on the section's red */}
              <Image
                src={asset("/brand/car-poster.webp")}
                alt=""
                width={1400}
                height={470}
                sizes="(min-width:1024px) 46vw, 92vw"
                className="mt-6 block h-auto w-full select-none lg:mt-12 lg:-ml-[6%] lg:w-[112%]"
              />
            </Reveal>
          </motion.div>

          <motion.div style={calm ? undefined : { x: plateX }}><Reveal delay={0.08}>
            <div id="lead-form" className="plate overflow-hidden p-6 sm:p-9">
              <AnimatePresence mode="wait" initial={false}>
                {status === "success" ? (
                  <motion.div
                    key="ok"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0, transition: { duration: DUR, ease: EASE } }}
                    exit={{ opacity: 0, transition: { duration: 0.2 } }}
                    className="grid place-items-center py-14 text-center"
                    role="status"
                  >
                    <CheckCircle2 className="size-14 text-[var(--ok)]" strokeWidth={1.25} />
                    <p className="font-display mt-6 text-[26px] tracking-wide uppercase text-ink">Заявка принята</p>
                    <p className="mt-3 max-w-[40ch] text-[16px] text-ink-2">
                      Андрей свяжется с вами и уточнит детали.
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
                  <motion.form key="form" onSubmit={submit} noValidate initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { duration: DUR, ease: EASE } }} exit={{ opacity: 0, transition: { duration: 0.2 } }} className="grid gap-5">
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
                          Телефон
                        </label>
                        <div className="field" data-invalid={!!errors.contact}>
                          <input
                            id="f-contact"
                            type="tel"
                            inputMode="tel"
                            autoComplete="tel"
                            value={f.contact}
                            onChange={(e) => set("contact", e.target.value)}
                            placeholder="+7 900 000-00-00"
                            aria-invalid={!!errors.contact}
                            aria-describedby={errors.contact ? "f-contact-err" : undefined}
                          />
                        </div>
                        {errors.contact && <p id="f-contact-err" role="alert" className="mt-2 text-[16px] text-[var(--danger)]">{errors.contact}</p>}
                      </div>
                    </div>
                    <ViaPicker id="f-via" value={f.via} onChange={(v) => set("via", v)} />
                    {/* the optional part stays folded, so the form reads as name, phone, where to talk, send */}
                    <details open={wish} onToggle={(e) => setWish(e.currentTarget.open)} className="group/w border-t border-line pt-5">
                      <summary className="label flex min-h-11 cursor-pointer list-none items-center justify-between [&::-webkit-details-marker]:hidden">
                        <span>
                          Добавить пожелания <span className="font-medium text-ink-3">· бюджет, кузов, сообщение</span>
                        </span>
                        <Plus aria-hidden className="size-5 shrink-0 text-accent-ink transition-transform duration-300 group-open/w:rotate-45" strokeWidth={3} />
                      </summary>
                      <div className="mt-4 grid gap-4">
                      <div>
                        <label htmlFor="f-budget" className="label">Бюджет</label>
                        <Select id="f-budget" aria-label="Бюджет" value={f.budget} onChange={(v) => set("budget", v)} options={BUDGETS} />
                      </div>
                      {PREFS.map((q) => (
                        <div key={q.key} role="radiogroup" aria-label={q.q} className="flex flex-wrap gap-2">
                          {q.options.map((o) => (
                            <button
                              key={o}
                              type="button"
                              role="radio"
                              aria-checked={f[q.key] === o}
                              onClick={() => set(q.key, f[q.key] === o ? "" : o)}
                              className="cursor-pointer rounded-full border border-line-strong px-3.5 py-1.5 text-[16px] font-bold text-ink-2 transition-[color,background-color,border-color,transform] duration-150 hover:border-accent hover:text-ink aria-checked:border-accent aria-checked:bg-accent-soft aria-checked:text-ink"
                            >
                              {o}
                            </button>
                          ))}
                        </div>
                      ))}
                      <div>
                        <label htmlFor="f-msg" className="label">
                          Сообщение
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
                      </div>
                    </details>
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
                        <span>
                          Согласен на обработку персональных данных и с{" "}
                          <a href={asset("/privacy/")} target="_blank" rel="noopener" className="underline decoration-line-strong underline-offset-4 hover:text-ink">
                            политикой конфиденциальности
                          </a>
                        </span>
                      </label>
                      {errors.consent && <p id="f-consent-err" role="alert" className="mt-2 text-[16px] text-[var(--danger)]">{errors.consent}</p>}
                    </div>
                    {status === "error" && (
                      <p role="alert" className="flex gap-3 rounded-[4px] border border-[var(--danger)] p-4 text-[16px] leading-snug text-ink">
                        <TriangleAlert className="mt-0.5 size-4 shrink-0 text-[var(--danger)]" strokeWidth={1.75} />
                        {sendError(contacts.length > 0)}
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
          </Reveal></motion.div>
        </div>
      </motion.div>
    </section>
  );
}

