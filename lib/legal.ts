import { SITE } from "./site";

// Blanks stay visible until NJ Motors confirms them (npm run check:publish lists them).
const BLANK = "______";

export const OPERATOR = SITE.operator.name ?? BLANK;
export const OPERATOR_EMAIL = SITE.operator.email ?? BLANK;
export const LEGAL_DRAFT = !SITE.operator.name || !SITE.operator.email;
export const LEGAL_UPDATED = "2 ноября 2026 г.";

// what the site's forms ask for, in the words both documents use
export const FORM_DATA =
  "имя, номер телефона, удобный способ связи (звонок, ВКонтакте, Telegram, MAX), бюджет, пожелания к автомобилю (кузов, двигатель, возраст), ссылка на объявление и текст сообщения";

// who receives the data when that is needed to buy and deliver the car
export const RECIPIENTS = `корейская экспортная компания ${SITE.legal.entity ?? "NJ Motors"} (Республика Корея), таможенный брокер и перевозчик`;
