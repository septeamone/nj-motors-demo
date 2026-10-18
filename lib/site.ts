import raw from "./site.json";

type Site = Omit<typeof raw, "contacts" | "owner" | "legal"> & {
  contacts: { phone: string | null; telegram: string | null; whatsapp: string | null; email: string | null; address: string | null };
  owner: { name: string | null; role: string; video: string | null; poster: string | null };
  legal: { entity: string | null; inn: string | null; ogrn: string | null };
};

export const SITE = raw as Site;

type Channel = { key: "phone" | "telegram" | "whatsapp" | "email" | "address"; label: string; value: string; href?: string };

/** Only contacts that NJ Motors has confirmed (non-null in site.json) are ever rendered. */
export function channels(): Channel[] {
  const c = SITE.contacts;
  const out: Channel[] = [];
  if (c.phone) out.push({ key: "phone", label: "Телефон", value: c.phone, href: `tel:${c.phone.replace(/[^+\d]/g, "")}` });
  if (c.telegram) out.push({ key: "telegram", label: "Telegram", value: c.telegram, href: `https://t.me/${c.telegram.replace(/^@/, "")}` });
  if (c.whatsapp) out.push({ key: "whatsapp", label: "WhatsApp", value: c.whatsapp, href: `https://wa.me/${c.whatsapp.replace(/\D/g, "")}` });
  if (c.email) out.push({ key: "email", label: "Эл. почта", value: c.email, href: `mailto:${c.email}` });
  if (c.address) out.push({ key: "address", label: "Офис", value: c.address });
  return out;
}

export const PRICE_LABEL = SITE.pricesConfirmed ? "Цена под ключ" : "Ориентир цены";
