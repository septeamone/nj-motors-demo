import { ArrowRight } from "lucide-react";
import { SplitHero } from "./SplitHero";

// Advantages on the first screen, big, the way the owner's favourite competitor shows them. Only confirmed facts;
// numbers (savings, cars delivered) are added once Andrey gives them.
const ADVANTAGES = [
  { v: "5–9 недель", t: "от выкупа до ключей" },
  { v: "Без посредников", t: "сделку ведёт сам Андрей" },
  { v: "Независимый осмотр", t: "до выкупа, решение за вами" },
  { v: "Фото и видео", t: "на каждом этапе сделки" },
];

/** Text half of the hero; SplitHero owns the split, the intro and the emblem. */
export function Hero() {
  return (
    <SplitHero>
      <div className="flex h-full flex-col justify-center px-5 pt-5 pb-6 sm:px-8 lg:pt-[96px] lg:pr-10 lg:pb-8 lg:pl-[max(2rem,calc((100vw-var(--page))/2+3rem))]">
        <h1 className="display text-[clamp(46px,12.5vw,64px)] !leading-[0.92] lg:text-[clamp(62px,6vw,108px)]">
          <span className="block">Из Кореи</span>{" "}
          <span className="block">
            в ваш город.
          </span>
        </h1>

        <p className="lead mt-4 !max-w-[40ch] max-sm:!text-[16px] lg:mt-6 lg:text-[18px]">
          Автомобили из Кореи под ключ с 2023 года. Цена, вознаграждение и 4 платежа записаны в договоре до оплаты.
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

        <ul className="mt-5 grid grid-cols-2 border-t border-line-strong lg:mt-10">
          {ADVANTAGES.map((a, i) => (
            <li key={a.v} className={`py-3 pr-3 lg:py-5 lg:pr-4 ${i % 2 ? "border-l border-line pl-4 lg:pl-6" : ""} ${i > 1 ? "border-t border-line" : ""}`}>
              <p className="font-display text-[16px] leading-[1.05] tracking-wide text-ink uppercase sm:text-[20px] lg:text-[clamp(22px,1.9vw,32px)]">{a.v}</p>
              <p className="hero-adv-note mt-1 text-[13px] leading-snug text-ink-2 sm:text-[15px] lg:mt-2 lg:text-[16px]">{a.t}</p>
            </li>
          ))}
        </ul>
      </div>
    </SplitHero>
  );
}
