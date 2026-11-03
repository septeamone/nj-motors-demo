import { ArrowRight } from "lucide-react";
import { NjIcon, type IconName } from "./NjIcon";
import { SplitHero } from "./SplitHero";

// Advantages on the first screen, big, the way the owner's favourite competitor shows them. Only confirmed facts;
// numbers (savings, cars delivered) are added once Andrey gives them.
const ADVANTAGES: { v: string; t: string; icon: IconName }[] = [
  { v: "Без комиссий", t: "Без наценок — напрямую от экспортёра", icon: "rub" },
  { v: "Детальный осмотр", t: "Фото, видео, толщиномер, диагностика от эксперта за счёт компании", icon: "inspect" },
  { v: "Страховка", t: "На полную стоимость машины на всех этапах транспортировки", icon: "shield" },
  { v: "Прозрачная оплата", t: "Официальные поэтапные платежи без полной предоплаты", icon: "contract" },
];

/** Text half of the hero; SplitHero owns the split, the intro and the emblem. */
export function Hero() {
  return (
    <SplitHero>
      <div className="flex h-full flex-col justify-center px-5 pt-4 pb-5 sm:px-8 lg:pt-[96px] lg:pr-10 lg:pb-8 lg:pl-[max(2rem,calc((100vw-var(--page))/2+3rem))]">
        <h1 className="display text-[clamp(38px,10.6vw,58px)] !leading-[0.92] lg:text-[clamp(62px,6vw,108px)]">
          <span className="block">Авто из Кореи</span>{" "}
          <span className="block">
            до <span className="text-accent">30%</span> дешевле
          </span>
          <span className="block">рынка РФ.</span>
        </h1>

        <p className="hero-lead lead mt-3 !max-w-[40ch] max-sm:!text-[15.5px] max-sm:!leading-snug lg:mt-6 lg:text-[18px]">
          Без посредников и наценок — напрямую от корейской экспортной компании. Подбираем, проверяем и привозим под ключ со всеми документами и полной страховкой.
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-3 lg:mt-8">
          <a href="#lead-form" className="btn btn-primary">
            Подобрать машину
            <ArrowRight className="size-[18px]" strokeWidth={2} />
          </a>
        </div>

        {/* the four advantages as raised paper tiles, the same kraft as the deal passport's pages */}
        <ul className="mt-4 grid grid-cols-2 gap-2 sm:gap-3 lg:mt-9">
          {ADVANTAGES.map((a) => (
            <li
              key={a.v}
              className="adv-tile rounded-[8px] bg-[var(--paper)] px-3 py-2.5 text-[var(--paper-ink)] sm:px-4 sm:py-3.5 lg:px-5 lg:py-4"
            >
              <div className="flex items-center gap-2 lg:gap-2.5">
                <NjIcon name={a.icon} className="size-5 shrink-0 sm:size-6 lg:size-7" />
                <p className="font-display text-[14.5px] leading-[1.05] tracking-wide uppercase sm:text-[19px] lg:text-[clamp(20px,1.6vw,28px)]">{a.v}</p>
              </div>
              <p className="mt-1 text-[12px] leading-[1.28] opacity-85 sm:text-[14px] lg:mt-1.5 lg:text-[15px]">{a.t}</p>
            </li>
          ))}
        </ul>
      </div>
    </SplitHero>
  );
}
