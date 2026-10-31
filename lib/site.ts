import raw from "./site.json";

type Site = Omit<typeof raw, "contacts" | "owner" | "legal"> & {
  contacts: { phone: string | null; telegram: string | null; whatsapp: string | null; max: string | null; email: string | null; address: string | null };
  owner: { name: string | null; role: string; video: string | null; poster: string | null };
  legal: { entity: string | null; inn: string | null; ogrn: string | null };
};

export const SITE = raw as Site;

type Channel = { key: "phone" | "telegram" | "whatsapp" | "max" | "email" | "address"; label: string; value: string; href?: string };

/** A dialler link with the country code: "8 (900) 123-45-67" and "+7 900 123-45-67" both become tel:+79001234567. */
export const telHref = (phone: string) => `tel:+${phone.replace(/\D/g, "").replace(/^8(?=\d{10}$)/, "7")}`;

/** Only contacts that NJ Motors has confirmed (non-null in site.json) are ever rendered. */
export function channels(): Channel[] {
  const c = SITE.contacts;
  const out: Channel[] = [];
  if (c.phone) out.push({ key: "phone", label: "Телефон", value: c.phone, href: telHref(c.phone) });
  if (c.telegram) out.push({ key: "telegram", label: "Telegram", value: c.telegram, href: `https://t.me/${c.telegram.replace(/^@/, "")}` });
  if (c.whatsapp) out.push({ key: "whatsapp", label: "WhatsApp", value: c.whatsapp, href: `https://wa.me/${c.whatsapp.replace(/\D/g, "")}` });
  if (c.max) out.push({ key: "max", label: "MAX", value: "MAX", href: /^https?:\/\//.test(c.max) ? c.max : undefined });
  if (c.email) out.push({ key: "email", label: "Эл. почта", value: c.email, href: `mailto:${c.email}` });
  if (c.address) out.push({ key: "address", label: "Офис", value: c.address });
  return out;
}

export const PRICE_LABEL = SITE.pricesConfirmed ? "Цена под ключ" : "Ориентир цены";
