import raw from "./site.json";

type Site = Omit<typeof raw, "contacts" | "owner" | "legal" | "social" | "metrika"> & {
  social: { tiktok: string | null; vk: string | null; telegram: string | null; youtube: string | null; max: string | null };
  contacts: { phone: string | null; telegram: string | null; vk: string | null; max: string | null; email: string | null; address: string | null };
  owner: { name: string | null; role: string; video: string | null; poster: string | null };
  // Yandex Metrika counter number; null = no counter on the site
  metrika: number | null;
  legal: { entity: string | null; regNo: string | null; address: string | null; inn: string | null; ogrn: string | null };
};

export const SITE = raw as Site;

type Channel = { key: "phone" | "telegram" | "vk" | "max" | "tiktok" | "email" | "address"; label: string; value: string; href?: string };

/** A dialler link with the country code: "8 (900) 123-45-67" and "+7 900 123-45-67" both become tel:+79001234567. */
export const telHref = (phone: string) => `tel:+${phone.replace(/\D/g, "").replace(/^8(?=\d{10}$)/, "7")}`;

/**
 * The VK link that opens a chat with the community (vk.me/<address>), not its wall: in the VK app it lands straight in
 * the messages. Accepts "njmotorskorea", "@njmotorskorea" or a vk.com / vk.ru link.
 */
export const vkChat = (v: string) => `https://vk.me/${v.replace(/^https?:\/\/(m\.)?vk\.(com|ru|me)\//, "").replace(/^@/, "").replace(/\/.*$/, "")}`;

/** Only contacts that NJ Motors has confirmed (non-null in site.json) are ever rendered. */
export function channels(): Channel[] {
  const c = SITE.contacts;
  const out: Channel[] = [];
  if (c.phone) out.push({ key: "phone", label: "Телефон", value: c.phone, href: telHref(c.phone) });
  if (c.telegram) out.push({ key: "telegram", label: "Telegram", value: c.telegram, href: `https://t.me/${c.telegram.replace(/^@/, "")}` });
  if (c.vk) out.push({ key: "vk", label: "ВКонтакте", value: "Написать во ВКонтакте", href: vkChat(c.vk) });
  if (c.max) out.push({ key: "max", label: "MAX", value: "MAX", href: /^https?:\/\//.test(c.max) ? c.max : undefined });
  if (SITE.social.tiktok) out.push({ key: "tiktok", label: "TikTok", value: "TikTok", href: SITE.social.tiktok });
  if (c.email) out.push({ key: "email", label: "Эл. почта", value: c.email, href: `mailto:${c.email}` });
  if (c.address) out.push({ key: "address", label: "Офис", value: c.address });
  return out;
}

export const PRICE_LABEL = SITE.pricesConfirmed ? "Цена под ключ" : "Ориентир цены";
