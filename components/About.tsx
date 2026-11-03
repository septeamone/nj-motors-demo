import { SITE, telHref } from "@/lib/site";
import { NjIcon } from "./NjIcon";
import { Reveal, SectionHead } from "./ui";

// Andrey's own words (njrules.docx, 03.11.2026)
const CITIES = ["Владивосток", "Москва", "Санкт-Петербург", "Красноярск", "Ижевск", "Воронеж"];
const PLACES = [
  { k: "Офис в Корее", v: "29, Sinheung-dong 3-ga, Jung-gu, Incheon, South Korea" },
  { k: "Экспортная стоянка", v: "135, Seohae-daero, Jung-gu, Incheon, South Korea" },
];

/** "About us": who NJ Motors is, where it stands in Korea, its offices in Russia, and how to call. */
export function About() {
  const phone = SITE.contacts.phone;
  return (
    <section id="about" className="bg-bg py-10 lg:py-16">
      <div className="mx-auto grid max-w-[var(--page)] gap-10 px-5 sm:px-8 lg:grid-cols-[minmax(0,6fr)_minmax(0,5fr)] lg:gap-16 lg:px-12 xl:px-20">
        <div>
          <SectionHead
            title="О нас"
            lead="NJ Motors Korea — прямой экспортёр автомобилей из Южной Кореи. Находимся непосредственно в Корее, в городе Инчхон."
          />
          <Reveal className="mt-6 grid max-w-[60ch] gap-4 text-[17px] leading-relaxed text-ink-2">
            <p>
              Возим автомобили без посредников и переплат, курируем весь процесс «под ключ» — от брони до постановки автомобиля на учёт. Доставляем
              автомобили в любой город РФ.
            </p>
            <p>
              Работаем с физическими и юридическими лицами. Предоставляем комфортные условия сотрудничества для компаний и тех, кто занимается
              привозом автомобилей под заказ.
            </p>
          </Reveal>
          <Reveal className="mt-8">
            <p className="label">Представительства в России</p>
            <ul className="mt-3 flex flex-wrap gap-2">
              {CITIES.map((c) => (
                <li key={c} className="rounded-full bg-surface px-4 py-2 text-[16px] font-bold text-ink">
                  {c}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>

        <Reveal delay={0.08} className="self-start rounded-[8px] bg-[var(--paper)] p-6 text-[var(--paper-ink)] sm:p-8">
          <ul className="grid gap-5">
            {PLACES.map((p) => (
              <li key={p.k} className="flex gap-4">
                <NjIcon name="pin" className="mt-0.5 size-7 shrink-0" />
                <div>
                  <p className="text-[15px] font-bold opacity-70">{p.k}</p>
                  <p className="mt-0.5 text-[17px] leading-snug font-bold">{p.v}</p>
                </div>
              </li>
            ))}
            {phone && (
              <li className="flex gap-4">
                <NjIcon name="phone" className="mt-0.5 size-7 shrink-0" />
                <div>
                  <p className="text-[15px] font-bold opacity-70">Телефон для связи</p>
                  <a href={telHref(phone)} className="mt-0.5 block text-[22px] leading-snug font-bold hover:underline">
                    {phone}
                  </a>
                </div>
              </li>
            )}
            <li className="flex gap-4">
              <NjIcon name="clock" className="mt-0.5 size-7 shrink-0" />
              <div>
                <p className="text-[15px] font-bold opacity-70">Время в Корее</p>
                <p className="mt-0.5 text-[17px] leading-snug font-bold">+6 часов от Москвы</p>
              </div>
            </li>
          </ul>
        </Reveal>
      </div>
    </section>
  );
}
