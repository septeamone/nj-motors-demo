import { ArrowRight } from "lucide-react";
import { SplitHero } from "./SplitHero";

const FACTS = [
  { k: "Маршрут", v: "Корея → Владивосток → ваш город" },
  { k: "От выкупа до ключей", v: "5–9 недель, ориентир" },
  { k: "Осмотр", v: "Независимый, до выкупа" },
  { k: "Договор", v: "Вознаграждение и этапы оплаты" },
];

/** Text half of the hero; SplitHero owns the split, the intro and the emblem. */
export function Hero() {
  return (
    <SplitHero>
      <div className="flex h-full flex-col justify-center px-5 pt-5 pb-6 sm:px-8 lg:pt-[96px] lg:pr-10 lg:pb-8 lg:pl-[max(2rem,calc((100vw-var(--page))/2+3rem))]">
        <h1 className="display text-[clamp(46px,12.5vw,64px)] !leading-[0.92] lg:text-[clamp(62px,6vw,108px)]">
          <span className="block">Из Кореи</span>
          <span className="block">
            в ваш город.
          </span>
        </h1>

        <p className="lead mt-4 !max-w-[40ch] max-sm:!text-[16px] lg:mt-6 lg:text-[18px]">
          С 2023 года подбираем, проверяем, привозим. Цену и каждый этап вы видите до оплаты.
        </p>

        <div className="mt-5 flex flex-wrap items-center gap-3 lg:mt-8">
          <a href="#contact" className="btn btn-primary">
            Оставить заявку
            <ArrowRight className="size-[18px]" strokeWidth={2} />
          </a>
          <a href="#calc" className="px-2 text-[16px] font-bold text-ink-2 underline decoration-line-strong underline-offset-[6px] transition-colors hover:text-ink">
            Посчитать стоимость самому
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
