"use client";

import { ArrowUpRight, ChevronDown } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  calculate,
  FUEL_LABEL,
  INLAND_LABEL,
  RATES,
  SEA_LABEL,
  THIS_YEAR,
  type Fuel,
  type Group,
  type Inland,
  type Part,
  type Sea,
} from "@/lib/calc";
import { fmt, rub } from "@/lib/format";
import { DUR, EASE } from "@/lib/motion";
import { NjIcon, type IconName } from "./NjIcon";
import { Odometer } from "./Odometer";
import { Select } from "./Select";
import { Reveal, SectionHead } from "./ui";

const YEARS = Array.from({ length: 12 }, (_, i) => String(THIS_YEAR - i));
// Five lines of the receipt; each opens to show what it is made of
const GROUPS: { id: Group; title: string }[] = [
  { id: "korea", title: "Автомобиль и услуги в Корее" },
  { id: "sea", title: "Море до Владивостока" },
  { id: "customs", title: "Таможня и оформление" },
  { id: "russia", title: "Дорога по России" },
  { id: "contract", title: "Вознаграждение NJ Motors" },
];

const SEA_ICON: Record<Sea, IconName> = { roro: "ship", container: "container" };
const INLAND_ICON: Record<Inland, IconName> = { vvo: "port", truck: "truck", rail: "rail", other: "pin" };

function Segmented<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string; icon?: IconName }[];
}) {
  return (
    <div>
      <span className="label">{label}</span>
      <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button key={o.value} type="button" role="radio" aria-checked={value === o.value} onClick={() => onChange(o.value)} className="pill inline-flex items-center gap-2.5 text-left">
            {o.icon && <NjIcon name={o.icon} className="size-6" />}
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Sum of a group: exact, a range, "from", or manager-only. */
function sum(parts: Part[]) {
  const known = parts.filter((p) => p.lo !== null);
  if (!known.length) return null;
  return {
    lo: known.reduce((s, p) => s + (p.lo ?? 0), 0),
    hi: known.reduce((s, p) => s + (p.hi ?? p.lo ?? 0), 0),
    open: known.some((p) => p.hi === null),
    partial: known.length < parts.length,
  };
}
const label = (s: NonNullable<ReturnType<typeof sum>>) => (s.open ? `от ${rub(s.lo)}` : s.lo === s.hi ? rub(s.lo) : `${fmt(s.lo)}–${fmt(s.hi)} ₽`);
const one = (p: Part) => (p.lo === null ? "уточнит Андрей" : p.hi === null ? `от ${rub(p.lo)}` : p.hi === p.lo ? rub(p.lo) : `${fmt(p.lo)}–${fmt(p.hi)} ₽`);

export function Calculator() {
  const [price, setPrice] = useState("18000000");
  const [year, setYear] = useState("2022");
  const [fuel, setFuel] = useState<Fuel>("petrol");
  const [volume, setVolume] = useState("1600");
  const [hp, setHp] = useState("150");
  const [sea, setSea] = useState<Sea>("roro");
  const [inland, setInland] = useState<Inland>("truck");
  const [opened, setOpened] = useState<Group | null>(null);
  // phones: the delivery choice is folded into one line until tapped
  const [route, setRoute] = useState(false);

  const priceKrw = +price || 0;
  const r = useMemo(
    () => calculate({ priceKrw, year: +year, volume: +volume || 0, hp: +hp || 0, fuel, sea, inland }),
    [priceKrw, year, volume, hp, fuel, sea, inland],
  );
  const { total, days } = r;
  const weeks = [Math.round(days.lo / 7), Math.round(days.hi / 7)];
  // nothing to count without a price, an engine size (unless electric) and a power
  const ready = priceKrw > 0 && +hp > 0 && (fuel === "electric" || +volume > 0);
  const totalText = !ready ? "—" : total.open ? `от ${rub(total.lo)}` : `${fmt(total.lo)}–${fmt(total.hi)} ₽`;

  // on phones the receipt is far below the fields: show the running total at the bottom while the fields are on screen
  const section = useRef<HTMLElement>(null);
  const receipt = useRef<HTMLDivElement>(null);
  const [inSection, setInSection] = useState(false);
  const [receiptSeen, setReceiptSeen] = useState(false);
  useEffect(() => {
    // by the share on screen, not isIntersecting: on the way out the last report comes just under the threshold,
    // while the element is still a little on screen, and nothing is reported once it has gone
    const a = new IntersectionObserver(([e]) => setInSection(e.intersectionRatio >= 0.05), { threshold: [0, 0.05] });
    const b = new IntersectionObserver(([e]) => setReceiptSeen(e.intersectionRatio >= 0.25), { threshold: [0, 0.25] });
    if (section.current) a.observe(section.current);
    if (receipt.current) b.observe(receipt.current);
    return () => {
      a.disconnect();
      b.disconnect();
    };
  }, []);

  // phones show one bar at the bottom: while the total floats there, the "leave a request" bar steps aside
  const pill = inSection && !receiptSeen && ready;
  useEffect(() => {
    const html = document.documentElement;
    if (pill) html.dataset.calcBar = "";
    else delete html.dataset.calcBar;
  }, [pill]);

  const request = () =>
    window.dispatchEvent(
      new CustomEvent<string>("lead-prefill", {
        detail:
          `Расчёт на сайте: автомобиль ${fmt(priceKrw)} ₩, ${year} г., ${FUEL_LABEL[fuel].toLowerCase()}` +
          `${fuel === "electric" ? "" : `, ${volume} см³`}, ${hp} л.с.; море: ${SEA_LABEL[sea].toLowerCase()}; по России: ${INLAND_LABEL[inland].replace(/^(Заберу|Другой)/, (w) => w.toLowerCase())}. ` +
          `Ориентир ${totalText} без вознаграждения NJ Motors.`,
      }),
    );

  return (
    <section ref={section} id="calc" className="mx-auto max-w-[var(--page)] px-5 pt-14 pb-10 sm:px-8 lg:px-12 lg:pt-20 lg:pb-14 xl:px-20">
      <SectionHead
        title="Сколько это стоит"
        lead="Итог пересчитывается сразу. Ставки и курсы на октябрь 2026."
      />

      <div className="mt-12 grid grid-cols-1 gap-8 lg:mt-16 lg:grid-cols-[minmax(0,6fr)_minmax(0,5fr)] lg:gap-12">
        <Reveal className="flex flex-col gap-8">
          <div>
            <label htmlFor="c-price" className="label">
              Цена автомобиля в Корее
            </label>
            <div className="field">
              <input
                id="c-price"
                inputMode="numeric"
                value={priceKrw ? fmt(priceKrw) : ""}
                onChange={(e) => setPrice(e.target.value.replace(/\D/g, "").slice(0, 10))}
                placeholder="0"
              />
              <span className="text-[16px] text-ink-3">₩</span>
            </div>
            <p className="hint">≈ {rub(priceKrw * RATES.krw)} по курсу ЦБ на {RATES.date}</p>
          </div>

          <div className="grid gap-5 sm:grid-cols-3">
            <div>
              <span className="label">Год выпуска</span>
              <Select aria-label="Год выпуска" value={year} onChange={setYear} options={YEARS.map((y) => ({ value: y, label: y }))} />
            </div>
            <div>
              <label htmlFor="c-vol" className="label">
                Объём двигателя
              </label>
              <div className="field" data-disabled={fuel === "electric"}>
                <input
                  id="c-vol"
                  inputMode="numeric"
                  disabled={fuel === "electric"}
                  value={fuel === "electric" ? "—" : volume}
                  onChange={(e) => setVolume(e.target.value.replace(/\D/g, "").slice(0, 4))}
                />
                <span className="text-[15px] text-ink-3">см³</span>
              </div>
            </div>
            <div>
              <label htmlFor="c-hp" className="label">
                Мощность
              </label>
              <div className="field">
                <input id="c-hp" inputMode="numeric" value={hp} onChange={(e) => setHp(e.target.value.replace(/\D/g, "").slice(0, 4))} />
                <span className="text-[15px] text-ink-3">л.с.</span>
              </div>
            </div>
          </div>
          <Segmented
            label="Тип двигателя"
            value={fuel}
            onChange={setFuel}
            options={(["petrol", "diesel", "hybrid", "electric"] as const).map((f) => ({ value: f, label: FUEL_LABEL[f] }))}
          />

          <div className="border-t border-line pt-6 lg:pt-8">
            <button
              type="button"
              onClick={() => setRoute((v) => !v)}
              aria-expanded={route}
              aria-controls="c-route"
              className="flex w-full cursor-pointer items-center justify-between gap-3 text-left lg:hidden"
            >
              <span>
                <span className="label">Доставка</span>
                <span className="mt-1 block text-[16px] leading-snug font-bold text-ink">
                  {SEA_LABEL[sea]} · {INLAND_LABEL[inland]}
                </span>
              </span>
              <ChevronDown className={`size-5 shrink-0 text-ink-2 transition-transform ${route ? "rotate-180" : ""}`} strokeWidth={2} />
            </button>
            <div id="c-route" className={`${route ? "mt-6" : "max-lg:hidden"} lg:mt-0`}>
            <p className="flex items-center gap-3 text-[17px] font-bold text-ink">
              <NjIcon name="ship" className="size-8" />
              Из Кореи в Россию автомобили идут только морем
            </p>
            <p className="mt-2 max-w-[60ch] text-[16px] leading-relaxed text-ink-2">
              Поезд и автовоз только развозят машину из Владивостока.
            </p>
            <div className="mt-6 grid gap-6">
              <Segmented
                label="1. Корея → Владивосток"
                value={sea}
                onChange={setSea}
                options={(["roro", "container"] as const).map((s) => ({ value: s, label: SEA_LABEL[s], icon: SEA_ICON[s] }))}
              />
              <Segmented
                label="2. Владивосток → вы"
                value={inland}
                onChange={setInland}
                options={(["vvo", "truck", "rail", "other"] as const).map((s) => ({ value: s, label: INLAND_LABEL[s], icon: INLAND_ICON[s] }))}
              />
            </div>
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.08} className="lg:sticky lg:top-24 lg:self-start">
          <div ref={receipt} className="receipt">
            <div className="flex items-baseline justify-between gap-3">
              <p className="font-display text-[22px] tracking-wide uppercase">Чек-расчёт</p>
              <p className="text-[14px] opacity-70">{RATES.date}</p>
            </div>

            <div className="mt-3 border-y border-line-strong py-4" aria-live="polite">
              <p className="text-[16px] font-bold opacity-75">Итого, ориентир</p>
              <div className="mt-3 text-[clamp(30px,3.6vw,46px)] leading-[1.08]" aria-label={`Итого ${totalText}`}>
                {!ready ? (
                  <>
                    —<span className="mt-1 block text-[15px] font-bold opacity-75">Укажите цену, объём и мощность</span>
                  </>
                ) : (
                  <>
                    <span className="mr-2 text-[0.42em] font-bold opacity-60">от</span>
                    <Odometer text={rub(total.lo)} />
                    {!total.open && (
                      <>
                        <br />
                        <span className="mr-2 text-[0.42em] font-bold opacity-60">до</span>
                        <Odometer text={rub(total.hi)} />
                      </>
                    )}
                  </>
                )}
              </div>
              <p className="mt-2 flex items-center gap-2 text-[15px] font-bold">
                <NjIcon name="clock" className="size-6" />
                Срок: около {weeks[0]}–{weeks[1]} нед. от выкупа {days.partial ? "до таможни во Владивостоке" : "до ключей"}
              </p>
            </div>

            <ul>
              {GROUPS.map((g) => {
                const rows = r.parts.filter((p) => p.group === g.id);
                if (!rows.length) return null;
                const s = sum(rows);
                const open = opened === g.id;
                return (
                  <li key={g.id} className="border-b border-line">
                    <button
                      type="button"
                      aria-expanded={open}
                      onClick={() => setOpened(open ? null : g.id)}
                      className="flex w-full cursor-pointer items-center gap-2 py-3 text-left"
                    >
                      <ChevronDown className={`size-4 shrink-0 opacity-60 transition-transform ${open ? "rotate-180" : ""}`} strokeWidth={2} />
                      <span className="flex-1 text-[16px] leading-tight font-bold">{g.title}</span>
                      <span className={`text-[16px] font-bold whitespace-nowrap ${s ? "" : "text-[var(--accent-fill)]"}`}>{!ready ? "—" : s ? label(s) : g.id === "contract" ? "по договору" : "уточнит Андрей"}</span>
                    </button>
                    <AnimatePresence initial={false}>
                      {open && (
                        <motion.ul
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: DUR, ease: EASE }}
                          className="overflow-hidden"
                        >
                          {rows.map((p) => (
                            <li key={p.key} className="pb-3 pl-6">
                              <div className="flex items-baseline justify-between gap-3">
                                <span className="text-[15px] font-bold">{p.label}</span>
                                <span className="text-[15px] font-bold whitespace-nowrap">{ready || p.lo === null ? one(p) : "—"}</span>
                              </div>
                              <p className="mt-0.5 text-[14.5px] leading-snug opacity-70">{p.note}</p>
                            </li>
                          ))}
                        </motion.ul>
                      )}
                    </AnimatePresence>
                  </li>
                );
              })}
            </ul>

            <p className="mt-3 text-[14px] leading-snug opacity-70">
              Сюда не входит вознаграждение NJ Motors: это фиксированная сумма, Андрей называет её до подписания и вписывает в договор
              {total.missing.length ? `. Не посчитаны строки «уточнит Андрей» (${total.missing.join(", ")})` : ""}.
            </p>

            <a href="#lead-form" onClick={request} className="btn btn-primary mt-4 w-full">
              Получить точный расчёт
              <ArrowUpRight className="size-[18px]" strokeWidth={2} />
            </a>
          </div>
        </Reveal>
      </div>

      {/* phones: the total follows the fields */}
      <AnimatePresence>
        {pill && (
          <motion.a
            href="#lead-form"
            onClick={request}
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ duration: DUR, ease: EASE }}
            className="hide-on-menu fixed inset-x-3 bottom-3 z-40 flex items-center justify-between gap-3 rounded-[8px] bg-[var(--paper)] px-4 py-3 text-[var(--paper-ink)] shadow-[0_14px_30px_var(--shadow)] lg:hidden"
          >
            <span className="text-[15px] font-bold opacity-75">Итого</span>
            <span className="num text-[22px] leading-none">{totalText}</span>
          </motion.a>
        )}
      </AnimatePresence>
    </section>
  );
}
