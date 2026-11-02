"use client";

import { ArrowUpRight, Check } from "lucide-react";
import { useState } from "react";
import { SITE, telHref, vkChat } from "@/lib/site";
import { BRAND, BrandIcon, type Brand } from "./BrandIcon";

// each button wears its own brand colour
const brandStyle = (b: Brand) => ({ "--b": BRAND[b].color, "--bf": BRAND[b].fill }) as React.CSSProperties;

const url = (v: string, host: string) => (/^https?:\/\//.test(v) ? v : `https://${host}/${v.replace(/^@/, "")}`);

/** Where a visitor can write to NJ Motors: only confirmed contacts from lib/site.json. Telegram takes the text pre-filled. */
function links(text?: string): { brand: Brand; label: string; href: string }[] {
  const c = SITE.contacts;
  const out: { brand: Brand; label: string; href: string }[] = [];
  if (c.telegram) {
    const tg = url(c.telegram, "t.me");
    out.push({ brand: "telegram", label: "Telegram", href: text ? `${tg}?text=${encodeURIComponent(text)}` : tg });
  }
  if (c.vk) out.push({ brand: "vk", label: "ВКонтакте", href: vkChat(c.vk) });
  if (c.max && /^https?:\/\//.test(c.max)) out.push({ brand: "max", label: "MAX", href: c.max });
  if (c.phone) out.push({ brand: "call", label: "Позвонить", href: telHref(c.phone) });
  return out;
}

/**
 * "Write to us": the site collects no personal data, so instead of a form the visitor opens a chat with NJ Motors.
 * With `text` (a car from the catalog, the quiz answers) the message is ready: Telegram gets it pre-filled, and a tap on
 * any button also copies it, so in VK or MAX it is one paste away.
 */
export function WriteUs({ text, className = "" }: { text?: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  const list = links(text);

  const copy = () => {
    if (!text) return;
    navigator.clipboard?.writeText(text).then(
      () => setCopied(true),
      () => {},
    );
  };

  return (
    <div className={className}>
      <ul className="grid grid-cols-2 gap-2.5 sm:gap-3">
        {list.map((l) => (
          <li key={l.brand}>
            <a
              href={l.href}
              target={l.brand === "call" ? undefined : "_blank"}
              rel={l.brand === "call" ? undefined : "noopener noreferrer"}
              onClick={copy}
              style={brandStyle(l.brand)}
              className="group flex min-h-14 items-center justify-center gap-2.5 rounded-full px-4 text-[16px] font-bold text-white transition-transform duration-150 [background:var(--bf)] hover:-translate-y-0.5 sm:text-[17px]"
            >
              <BrandIcon brand={l.brand} className="size-[22px] shrink-0" />
              {l.label}
              <ArrowUpRight className="hidden size-4 shrink-0 opacity-70 transition-opacity group-hover:opacity-100 sm:block" strokeWidth={2.2} />
            </a>
          </li>
        ))}
      </ul>
      {text && (
        <p aria-live="polite" className="mt-3 text-[14px] leading-snug text-ink-3">
          {copied ? (
            <span className="inline-flex items-center gap-1.5 text-ink-2">
              <Check className="size-4 text-[var(--ok)]" strokeWidth={2.4} />
              Текст скопирован — вставьте его в чат
            </span>
          ) : (
            "Текст сообщения подставим сами: в Telegram он появится в чате, в ВКонтакте и MAX его можно будет вставить."
          )}
        </p>
      )}
    </div>
  );
}
