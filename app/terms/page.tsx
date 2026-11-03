import type { Metadata } from "next";
import { Legal } from "@/components/Legal";
import credits from "@/lib/credits.json";
import { CARS } from "@/lib/data";

// who took the catalog photos (one of them is CC BY 4.0 and needs its author named)
const SOURCES = CARS.filter((c) => c.slug in credits).map((c) => {
  const x = (credits as Record<string, { lic: string; artist: string; page: string }>)[c.slug];
  return `${c.brand} ${c.model}: ${x.artist || "автор не указан"}, ${x.lic}, ${x.page}`;
});

export const metadata: Metadata = { title: "Пользовательское соглашение — NJ Motors" };

export default function Terms() {
  return (
    <Legal
      title="Пользовательское соглашение"
      sections={[
        {
          title: "Назначение Сайта",
          text: ["Сайт NJ Motors носит информационный характер: он рассказывает об услугах подбора, покупки и доставки автомобилей из Кореи и помогает связаться с нами в мессенджерах и соцсетях."],
        },
        {
          title: "Не является офертой",
          text: [
            "Информация на Сайте, включая цены и сроки, не является публичной офертой. Цены и сроки ориентировочные, итоговые условия фиксируются в индивидуальном договоре в письменной форме.",
            "Курсы валют, таможенные ставки и тарифы перевозчиков меняются, поэтому точная стоимость автомобиля считается непосредственно перед покупкой.",
          ],
        },
        {
          title: "Фотографии автомобилей",
          text: ["Фотографии в каталоге иллюстративные. Реальный автомобиль, который вы получите, может отличаться от изображённого.", ...(SOURCES.length ? ["Источники фотографий:", ...SOURCES] : [])],
        },
        {
          title: "Права на материалы",
          text: ["Логотип NJ Motors, тексты и оформление Сайта принадлежат NJ Motors. Копировать их без согласия владельца нельзя."],
        },
        {
          title: "Применимое право",
          text: ["Отношения, связанные с использованием Сайта, регулируются законодательством Российской Федерации."],
        },
      ]}
    />
  );
}
