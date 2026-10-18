"use client";

import { Check, Mail, Plus, Send, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { CARS } from "@/lib/data";
import { fmt, rub } from "@/lib/format";
import { Reveal, SectionHead } from "./ui";

type Row = { id: string; slug: string; name: string; price: number };

const START: Row[] = CARS.filter((c) => ["palisade", "prado", "zeekr", "vezel"].includes(c.slug)).map((c) => ({
  id: c.slug,
  slug: c.slug,
  name: `${c.brand} ${c.model}`,
  price: c.price,
}));

const POINTS = [
  ["Карточки автомобилей", "Добавляйте и убирайте машины, меняйте цену, пробег и фото. Сколько нужно."],
  ["Тексты и фото сайта", "Заголовки, описания, контакты, этапы работы. Любой текст на странице."],
  ["Заявки не теряются", "Каждая заявка приходит в Telegram и на почту одновременно."],
  ["Курс валют", "Обновляется сам, вам не нужно ничего пересчитывать вручную."],
];

export function Control() {
  const [rows, setRows] = useState<Row[]>(START);
  const [active, setActive] = useState(START[0].id);
  const [sent, setSent] = useState<0 | 1 | 2>(0);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  const current = rows.find((r) => r.id === active) ?? rows[0];
  const update = (id: string, patch: Partial<Row>) => setRows((p) => p.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  const add = () => {
    const free = CARS.find((c) => !rows.some((r) => r.slug === c.slug));
    if (!free || rows.length >= 6) return;
    const row = { id: `${free.slug}-${rows.length}`, slug: free.slug, name: `${free.brand} ${free.model}`, price: free.price };
    setRows((p) => [...p, row]);
    setActive(row.id);
  };
  const remove = (id: string) => {
    if (rows.length <= 1) return;
    const next = rows.filter((r) => r.id !== id);
    setRows(next);
    if (active === id) setActive(next[0].id);
  };
  const send = () => {
    if (sent === 1) return;
    clearTimeout(timer.current);
    setSent(1);
    timer.current = setTimeout(() => setSent(2), 1100);
  };

  return (
    <section id="control" className="border-t border-line py-24 lg:py-32">
      <div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-12 xl:px-20">
        <SectionHead
          title="Сайт, который вы правите сами"
          lead="Меняете информацию так же просто, как в таблице. Для этого не нужен программист и не нужно ждать."
        />

        <div className="mt-14 grid grid-cols-1 gap-10 lg:mt-20 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-14">
          <ul className="border-t-[1.5px] border-ink/80">
            {POINTS.map(([t, d], i) => (
              <Reveal as="li" key={t} delay={i * 0.05}>
                <div className="border-b border-line py-6">
                  <h3 className="text-[19px] font-bold text-ink">{t}</h3>
                  <p className="mt-1.5 max-w-[46ch] text-[15.5px] leading-relaxed text-ink-2">{d}</p>
                </div>
              </Reveal>
            ))}
          </ul>

          <Reveal delay={0.08}>
            <div className="overflow-hidden rounded-[24px] border border-line bg-surface">
              <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-3.5">
                <div className="flex items-center gap-2" aria-hidden>
                  <span className="size-2.5 rounded-full bg-line-strong" />
                  <span className="size-2.5 rounded-full bg-line-strong" />
                  <span className="size-2.5 rounded-full bg-line-strong" />
                </div>
                <p className="text-[16px] font-semibold text-ink-3">Пример панели управления. Попробуйте изменить цену</p>
              </div>

              <div className="grid gap-0 md:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
                {/* editable list */}
                <div className="border-b border-line p-4 sm:p-5 md:border-r md:border-b-0">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-[16px] font-bold text-ink">Каталог · {rows.length}</p>
                    <button
                      type="button"
                      onClick={add}
                      disabled={rows.length >= 6}
                      className="inline-flex h-9 items-center gap-1.5 rounded-full border border-line-strong px-3.5 text-[16px] font-bold text-ink transition-colors hover:border-accent hover:text-accent-ink disabled:opacity-40"
                    >
                      <Plus className="size-4" strokeWidth={2} /> Добавить
                    </button>
                  </div>
                  <ul className="grid gap-2">
                    <AnimatePresence initial={false}>
                      {rows.map((r) => (
                        <motion.li
                          key={r.id}
                          layout
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3, ease: [0.2, 0, 0, 1] }}
                          className="overflow-hidden"
                        >
                          <div
                            className={`flex items-center gap-2 rounded-2xl border p-2 transition-colors ${active === r.id ? "border-accent bg-accent-soft" : "border-line bg-surface-2"}`}
                          >
                            <input
                              aria-label="Название"
                              value={r.name}
                              onFocus={() => setActive(r.id)}
                              onChange={(e) => update(r.id, { name: e.target.value.slice(0, 32) })}
                              className="h-10 min-w-0 flex-1 rounded-xl bg-transparent px-3 text-[16px] font-bold text-ink outline-none focus-visible:bg-bg"
                            />
                            <input
                              aria-label="Цена"
                              inputMode="numeric"
                              value={fmt(r.price)}
                              onFocus={() => setActive(r.id)}
                              onChange={(e) => update(r.id, { price: +e.target.value.replace(/\D/g, "").slice(0, 8) || 0 })}
                              className="h-10 w-[112px] rounded-xl bg-transparent px-3 text-right text-[16px] font-semibold text-ink-2 outline-none focus-visible:bg-bg"
                            />
                            <button
                              type="button"
                              onClick={() => remove(r.id)}
                              disabled={rows.length <= 1}
                              aria-label={`Убрать ${r.name}`}
                              className="grid size-9 shrink-0 place-items-center rounded-full text-ink-3 transition-colors hover:text-ink disabled:opacity-30"
                            >
                              <X className="size-4" strokeWidth={1.75} />
                            </button>
                          </div>
                        </motion.li>
                      ))}
                    </AnimatePresence>
                  </ul>
                </div>

                {/* live preview of the site card */}
                <div className="flex flex-col gap-3 p-4 sm:p-5">
                  <p className="text-[16px] font-semibold text-ink-3">Так это выглядит на сайте</p>
                  <div className="overflow-hidden rounded-[20px] border border-line bg-bg">
                    <div className="stage aspect-[16/10]">
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={current.id}
                          initial={{ opacity: 0, x: -24 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 24 }}
                          transition={{ duration: 0.3, ease: [0.2, 0, 0, 1] }}
                          className="absolute inset-0"
                        >
                          <Image
                            className="car !bottom-[16%] !w-[74%]"
                            src={`/cars/${current.slug}.webp`}
                            alt=""
                            width={1400}
                            height={800}
                          />
                        </motion.div>
                      </AnimatePresence>
                    </div>
                    <div className="p-4">
                      <p className="font-display text-[18px] leading-tight tracking-tight text-ink">{current.name || "Без названия"}</p>
                      <p className="num mt-1.5 text-[20px] text-ink">{rub(current.price)}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* leads go to two places */}
              <div className="flex flex-col gap-4 border-t border-line p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                <div>
                  <p className="text-[16px] font-bold text-ink">Заявки приходят в два места сразу</p>
                  <p className="mt-0.5 text-[16px] text-ink-3">Нажмите, чтобы посмотреть, как это выглядит</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <button type="button" onClick={send} className="btn btn-primary btn-sm">
                    {sent === 1 ? "Отправляем" : "Тестовая заявка"}
                  </button>
                  <div className="flex gap-2" aria-live="polite">
                    {[
                      [Send, "Telegram"],
                      [Mail, "Почта"],
                    ].map(([Icon, label], i) => {
                      const I = Icon as typeof Send;
                      const ok = sent === 2;
                      return (
                        <span
                          key={label as string}
                          className={`inline-flex h-9 items-center gap-1.5 rounded-full border px-3 text-[16px] font-bold transition-colors duration-500 ${ok ? "border-[var(--ok)] text-[var(--ok)]" : "border-line-strong text-ink-3"}`}
                          style={{ transitionDelay: ok ? `${i * 250}ms` : "0ms" }}
                        >
                          {ok ? <Check className="size-3.5" strokeWidth={2.5} /> : <I className="size-3.5" strokeWidth={1.75} />}
                          {label as string}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
            <p className="mt-4 text-[16px] text-ink-3">
              Это упрощённый пример. Панель управления настроим под ваш бизнес и покажем, как ею пользоваться.
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
