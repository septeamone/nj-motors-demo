import { ArrowUpRight } from "lucide-react";
import { NjIcon, type IconName } from "./NjIcon";
import { Bolt, Reveal } from "./ui";

const eyebrow = (icon: IconName, text: string) => (
  <p className="eyebrow flex items-center gap-3">
    <NjIcon name={icon} className="size-9 shrink-0" />
    {text}
  </p>
);

const FLOW = ["Заявка", "Подбор", "Проверка", "Покупка", "Доставка", "Передача"];

/** The four things a visitor must grasp in seconds: what, how, why trust, how to get a quote. */
export function Strip() {
  return (
    <section aria-label="Коротко о работе" className="relative border-y border-line-strong bg-bg-2">
      <div className="mx-auto max-w-[var(--page)] px-5 sm:px-8 lg:px-12 xl:px-20">
        <Reveal>
          <div className="grid divide-y divide-line sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4 lg:divide-x">
            <div className="py-8 lg:py-10 lg:pr-8">
              {eyebrow("globe", "01 · Что привозим")}
              <p className="font-display mt-4 text-[28px] leading-[1.05] tracking-wide uppercase">Из Южной Кореи</p>
              <p className="mt-3 text-[16px] leading-relaxed text-ink-2">Любая модель с корейского рынка: от кроссовера до электромобиля.</p>
            </div>
            <div className="py-8 sm:pl-8 lg:px-8 lg:py-10">
              {eyebrow("route", "02 · Как покупаем")}
              <ol className="mt-4 flex flex-wrap items-center gap-x-1.5 gap-y-1">
                {FLOW.map((f, i) => (
                  <li key={f} className="flex items-center gap-1.5">
                    <span className="font-display text-[20px] leading-none tracking-wide uppercase">{f}</span>
                    {i < FLOW.length - 1 && <Bolt size={10} className="text-accent-ink" />}
                  </li>
                ))}
              </ol>
              <p className="mt-3 text-[16px] leading-relaxed text-ink-2">Под ключ: вы получаете автомобиль и документы, остальное делаем мы.</p>
            </div>
            <div className="py-8 lg:px-8 lg:py-10">
              {eyebrow("shield", "03 · Почему нам можно доверять")}
              <p className="font-display mt-4 text-[28px] leading-[1.05] tracking-wide uppercase">Всё до оплаты</p>
              <p className="mt-3 text-[16px] leading-relaxed text-ink-2">
                Условия в договоре, оплата по этапам, фото- и видеоотчёт до выкупа. С 2023 года.
              </p>
            </div>
            <div className="flex flex-col justify-between gap-5 py-8 sm:pl-8 lg:py-10 lg:pl-8">
              <div>
                {eyebrow("calc", "04 · Как получить расчёт")}
                <p className="mt-4 text-[16px] leading-relaxed text-ink-2">Опишите задачу в заявке, менеджер пришлёт варианты и расчёт стоимости.</p>
              </div>
              <a href="#contact" className="btn btn-primary self-start">
                Рассчитать стоимость
                <ArrowUpRight className="size-[18px]" strokeWidth={2} />
              </a>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
