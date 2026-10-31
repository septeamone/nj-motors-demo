/**
 * Cost of a car from Korea. Real rules, October 2026.
 * Sources: CBR exchange rates of 17.10.2026; the unified customs rate (Decision of the EEC Council No. 107),
 * the customs-fee scale and the utilisation-fee tables for 2026 as published by importers and customs portals;
 * freight and delivery ranges from importers' open calculators and carriers' price lists.
 * The tables change a few times a year: update this file and RATES.date together.
 */

export const RATES = {
  date: "17.10.2026",
  krw: 62.0079 / 1000, // ₽ per 1 ₩
  eur: 93.7187, // ₽ per €
  usd: 83.6177, // ₽ per $
};
export const THIS_YEAR = 2026;

export type Fuel = "petrol" | "diesel" | "hybrid" | "electric";
/** Korea → Vladivostok. There is no other sea route into Russia for cars. */
export type Sea = "roro" | "container";
/** Vladivostok → the buyer. A train or a truck only carries the car across Russia, never from Korea. */
export type Inland = "vvo" | "truck" | "rail" | "other";

export const FUEL_LABEL: Record<Fuel, string> = { petrol: "Бензин", diesel: "Дизель", hybrid: "Гибрид", electric: "Электро" };
export const SEA_LABEL: Record<Sea, string> = { roro: "Специальное судно для автомобилей", container: "В контейнере" };
export const INLAND_LABEL: Record<Inland, string> = {
  vvo: "Заберу во Владивостоке",
  truck: "Москва и центр, автовозом",
  rail: "Москва и центр, по железной дороге",
  other: "Другой город",
};

export type Group = "korea" | "sea" | "customs" | "russia" | "contract";
/** lo === null: the manager names it. hi === null with a lo: "from lo, and up". hi === lo: exact. */
export type Part = { key: string; group: Group; label: string; note: string; lo: number | null; hi: number | null };

export type CalcInput = { priceKrw: number; year: number; volume: number; hp: number; fuel: Fuel; sea: Sea; inland: Inland };

const same = (key: string, group: Group, label: string, note: string, v: number): Part => ({ key, group, label, note, lo: v, hi: v });
const range = (key: string, group: Group, label: string, note: string, lo: number, hi: number): Part => ({ key, group, label, note, lo, hi });
const manager = (key: string, group: Group, label: string, note: string): Part => ({ key, group, label, note, lo: null, hi: null });

/** Unified customs rate for individuals (EEC Decision No. 107). Returns €. */
function dutyEur(ageYears: number, volume: number, valueEur: number) {
  if (ageYears <= 3) {
    const rows: [number, number, number][] = [
      [8500, 0.54, 2.5],
      [16700, 0.48, 3.5],
      [42300, 0.48, 5.5],
      [84500, 0.48, 7.5],
      [169000, 0.48, 15],
      [Infinity, 0.48, 20],
    ];
    const [, pct, min] = rows.find(([lim]) => valueEur <= lim)!;
    return Math.max(valueEur * pct, volume * min);
  }
  const per = ageYears <= 5 ? [1.5, 1.7, 2.5, 2.7, 3, 3.6] : [3, 3.2, 3.5, 4.8, 5, 5.7];
  const lims = [1000, 1500, 1800, 2300, 3000, Infinity];
  return volume * per[lims.findIndex((l) => volume <= l)];
}

/** Customs-clearance fee scale for 2026, by customs value in ₽. */
function customsFee(valueRub: number) {
  const scale: [number, number][] = [
    [200_000, 1231],
    [450_000, 2462],
    [1_200_000, 4924],
    [2_700_000, 13_541],
    [4_200_000, 18_465],
    [5_500_000, 21_344],
    [10_000_000, 49_240],
    [Infinity, 73_860],
  ];
  return scale.find(([lim]) => valueRub <= lim)![1];
}

// Utilisation fee above the preferential case: [power up to (hp), amount up to 3 years, amount over 3 years], ₽
const UTIL_1000_2000: [number, number, number][] = [
  [190, 900_000, 1_492_800],
  [220, 952_800, 1_584_000],
  [250, 1_010_400, 1_677_600],
  [280, 1_142_400, 1_838_400],
  [310, 1_291_200, 2_011_200],
  [340, 1_459_200, 2_203_200],
  [370, 1_663_200, 2_412_000],
  [400, 1_896_000, 2_640_000],
  [430, 2_160_000, 2_892_000],
  [460, 2_464_800, 3_168_000],
  [500, 2_808_000, 3_468_000],
  [Infinity, 3_201_600, 3_796_800],
];
// 2001–3000 cm³: published tables disagree for the upper rows, so this is only the lower bound ("from")
const UTIL_2000_3000: [number, number, number][] = [
  [190, 2_250_400, 3_407_200],
  [220, 2_306_800, 3_456_000],
  [250, 2_364_000, 3_501_600],
  [280, 2_402_400, 3_552_000],
  [310, 2_520_000, 3_660_000],
  [Infinity, 2_620_800, 3_770_400],
];

function utilisation(isNew: boolean, volume: number, hp: number, fuel: Fuel): Part {
  const key = "util";
  const label = "Утилизационный сбор";
  if (fuel === "electric") return manager(key, "customs", label, "Для электромобилей считает Андрей по действующей шкале");
  const preferential = fuel === "hybrid" ? hp <= 80 : hp <= 160 && volume <= 3000;
  if (preferential)
    return same(key, "customs", label, "Льготный: личное пользование, не больше одного автомобиля в год, не продавать 12 месяцев", isNew ? 3400 : 5200);
  if (fuel === "hybrid") return manager(key, "customs", label, "Мощный гибрид: сбор считают по отдельной шкале, назовёт Андрей");
  const table = volume > 1000 && volume <= 2000 ? UTIL_1000_2000 : volume > 2000 && volume <= 3000 ? UTIL_2000_3000 : null;
  if (!table) return manager(key, "customs", label, "Для такого объёма двигателя считает Андрей");
  const row = table.find(([lim]) => hp <= lim)!;
  const v = isNew ? row[1] : row[2];
  const note = "Мощность выше 160 л.с.: льготы нет, ставка коммерческая";
  return table === UTIL_1000_2000 ? same(key, "customs", label, note, v) : { key, group: "customs", label, note: `${note}. Таблицы расходятся, сумма не меньше этой`, lo: v, hi: null };
}

export function calculate(i: CalcInput) {
  const age = Math.max(0, THIS_YEAR - i.year);
  const isNew = age <= 3;
  const car = i.priceKrw * RATES.krw;

  const sea =
    i.sea === "roro"
      ? range("sea", "sea", "Море: Корея → Владивосток", "Автомобиль заезжает на судно своим ходом, погрузка и выгрузка в портах", 62_000, 120_000)
      : range("sea", "sea", "Море: Корея → Владивосток", "Отдельный контейнер на одну машину, от $1 200 до $2 000", Math.round(1200 * RATES.usd), Math.round(2000 * RATES.usd));

  const customsValue = car + ((sea.lo ?? 0) + (sea.hi ?? 0)) / 2;
  const duty = i.fuel === "electric" ? null : dutyEur(age, i.volume, customsValue / RATES.eur) * RATES.eur;
  const ageNote = isNew ? "до 3 лет: процент от стоимости, но не меньше ставки за см³" : age <= 5 ? "от 3 до 5 лет: ставка за каждый см³ объёма" : "старше 5 лет: повышенная ставка за каждый см³";

  const inland: Part =
    i.inland === "vvo"
      ? same("inland", "russia", "По России", "Забираете машину в порту Владивостока, доставка не нужна", 0)
      : i.inland === "truck"
        ? range("inland", "russia", "Владивосток → Москва", "Автовоз, около 9 000 км", 170_000, 200_000)
        : i.inland === "rail"
          ? range("inland", "russia", "Владивосток → Москва", "Железная дорога, автомобиль в контейнере", 130_000, 180_000)
          : manager("inland", "russia", "Владивосток → ваш город", "Цена зависит от расстояния, назовёт Андрей");

  const parts: Part[] = [
    same("car", "korea", "Автомобиль в Корее", `${Math.round(i.priceKrw).toLocaleString("ru-RU")} ₩ по курсу ЦБ ${RATES.date}`, car),
    same("dealer", "korea", "Услуги в Корее", "Осмотр, оформление покупки, экспортные документы, доставка в порт: 500 000 ₩", 500_000 * RATES.krw),
    sea,
    same("insurance", "sea", "Страховка груза", "На время морской перевозки", 5_200),
    duty === null ? manager("duty", "customs", "Пошлина (единая ставка)", "Для электромобилей считает Андрей") : same("duty", "customs", "Пошлина (единая ставка)", ageNote, duty),
    same("fee", "customs", "Таможенный сбор", "Фиксированная сумма по стоимости автомобиля", customsFee(customsValue)),
    utilisation(isNew, i.volume, i.hp, i.fuel),
    same("broker", "customs", "Брокер, склад, лаборатория, ЭПТС", "Оформление декларации и временное хранение в порту", 90_000),
    inland,
    manager("service", "contract", "Вознаграждение NJ Motors", "Фиксированная сумма, прописана в договоре до первого платежа"),
  ];

  let lo = 0;
  let hi = 0;
  let open = false;
  const missing: string[] = [];
  for (const p of parts) {
    if (p.group === "contract") continue;
    if (p.lo === null) {
      missing.push(p.label);
      continue;
    }
    lo += p.lo;
    hi += p.hi ?? p.lo;
    if (p.hi === null) open = true;
  }

  const seaDays = i.sea === "roro" ? [14, 21] : [18, 30];
  const inlandDays = i.inland === "truck" ? [18, 22] : i.inland === "rail" ? [14, 28] : [0, 0];
  const days = { lo: seaDays[0] + 7 + inlandDays[0], hi: seaDays[1] + 17 + inlandDays[1], partial: i.inland === "other" };

  return { parts, total: { lo, hi, open, missing }, days, age, isNew };
}
