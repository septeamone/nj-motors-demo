import { ArrowRight } from "lucide-react";
import { SplitHero } from "./SplitHero";
import { Bolt } from "./ui";

const FACTS = [
  { k: "Маршрут", v: "Корея → Владивосток → ваш город" },
  { k: "Срок до ключей · ориентир", v: "5–9 недель" },
  { k: "Сделка", v: "Договор и оплата по этапам" },
  { k: "Контроль", v: "Фото- и видеоотчёт до выкупа" },
];

/** Text half of the hero; SplitHero owns the split, the intro and the emblem. */
export function Hero() {
  return (
    <SplitHero>
      <div className="flex h-full flex-col justify-center px-5 pt-5 pb-6 sm:px-8 lg:pt-[96px] lg:pr-10 lg:pb-8 lg:pl-[max(2rem,calc((100vw-var(--page))/2+3rem))]">
        <p className="eyebrow flex items-center gap-3">
          <Bolt size={14} className="text-accent-ink" />
          Автомобили из Кореи · с 2023 года
        </p>

        <h1 className="display mt-4 text-[clamp(46px,12.5vw,64px)] !leading-[0.92] lg:mt-6 lg:text-[clamp(62px,6vw,108px)]">
          <span className="block">Из Кореи</span>
          <span className="block">
            в ваш <span className="text-accent-ink">город.</span>
          </span>
        </h1>

        <p className="lead mt-4 !max-w-[40ch] max-sm:!text-[16px] lg:mt-6 lg:text-[18px]">
          Подбираем, проверяем, привозим. Цену и каждый этап вы видите до оплаты.
        </p>

        <div className="mt-5 flex flex-wrap items-center gap-3 lg:mt-8">
          <a href="#contact" className="btn btn-primary">
            Получить расчёт
            <ArrowRight className="size-[18px]" strokeWidth={2} />
          </a>
          <a href="#catalog" className="btn btn-ghost max-sm:hidden">
            Смотреть автомобили
          </a>
          <a href="#calc" className="px-2 text-[16px] font-bold text-ink-2 underline decoration-line-strong underline-offset-[6px] transition-colors hover:text-ink">
            Прикинуть цену самому
          </a>
        </div>

        <dl className="mt-10 hidden grid-cols-2 border-t border-line-strong lg:grid">
          {FACTS.map((f, i) => (
            <div key={f.k} className={`py-4 pr-4 ${i % 2 ? "border-l border-line pl-6" : ""} ${i > 1 ? "border-t border-line" : ""}`}>
              <dt className="label">{f.k}</dt>
              <dd className="mt-1.5 text-[16px] leading-snug font-bold text-ink">{f.v}</dd>
            </div>
          ))}
        </dl>
      </div>
    </SplitHero>
  );
}
