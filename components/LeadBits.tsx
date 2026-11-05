"use client";

import { ArrowUpRight, Check, Copy } from "lucide-react";
import { useState } from "react";
import { SITE, telHref, vkChat } from "@/lib/site";
import { BRAND, BrandIcon, type Brand } from "./BrandIcon";
import { IconSwap } from "./IconSwap";

// each button wears its own brand colour
const brandStyle = (b: Brand) => ({ "--b": BRAND[b].color, "--bf": BRAND[b].fill }) as React.CSSProperties;

const url = (v: string, host: string) => (/^https?:\/\//.test(v) ? v : `https://${host}/${v.replace(/^@/, "")}`);

type Link = { brand: Brand; label: string; href: string; fills: boolean };

/**
 * Where a visitor can write to NJ Motors: only confirmed contacts from lib/site.json. Of these only Telegram can open a
 * chat with the text already typed (t.me/<user>?text=); VK, MAX and TikTok links open the chat empty.
 */
function links(text?: string): Link[] {
  const c = SITE.contacts;
  const out: Link[] = [];
  if (c.telegram) {
    const tg = url(c.telegram, "t.me");
    out.push({ brand: "telegram", label: "Telegram", href: text ? `${tg}?text=${encodeURIComponent(text)}` : tg, fills: true });
  }
  if (c.vk) out.push({ brand: "vk", label: "ВКонтакте", href: vkChat(c.vk), fills: false });
  if (c.max && /^https?:\/\//.test(c.max)) out.push({ brand: "max", label: "MAX", href: c.max, fills: false });
  if (SITE.social.tiktok) out.push({ brand: "tiktok", label: "TikTok", href: SITE.social.tiktok, fills: false });
  if (c.phone) out.push({ brand: "call", label: "Позвонить", href: telHref(c.phone), fills: true });
  return out;
}

const copyText = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // older browsers: a hidden field and the copy command
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.cssText = "position:fixed;opacity:0;top:0";
    document.body.append(ta);
    ta.select();
    const ok = document.execCommand("copy");
    ta.remove();
    return ok;
  }
};

/**
 * "Write to us": the site collects no personal data, so instead of a form the visitor opens a chat with NJ Motors.
 * With `text` (a car from the catalog, the quiz answers) the ready message is shown. Telegram gets it typed in; for VK,
 * MAX and TikTok, which cannot take a text in the link, a tap copies it first, says "paste it", then opens the chat.
 */
export function WriteUs({ text, className = "" }: { text?: string; className?: string }) {
  const [note, setNote] = useState<"" | "copied" | "paste">("");
  const list = links(text);

  const open = async (e: React.MouseEvent<HTMLAnchorElement>, l: Link) => {
    if (!text || l.fills) return; // Telegram and the phone need nothing more
    e.preventDefault();
    const ok = await copyText(text);
    setNote(ok ? "paste" : "");
    // a moment to read the hint, then the chat
    window.setTimeout(() => {
      // ("noopener" in the features would make window.open return null even on success, so it is cut by hand)
      const w = window.open(l.href, "_blank");
      if (w) w.opener = null;
      else location.href = l.href;
    }, ok ? 900 : 0);
  };

  return (
    <div className={className}>
      {text && (
        <div className="mb-5">
          <div className="flex items-center justify-between gap-3">
            <p className="label">Ваше сообщение</p>
            <button
              type="button"
              onClick={async () => setNote((await copyText(text)) ? "copied" : "")}
              className="inline-flex min-h-9 cursor-pointer items-center gap-1.5 text-small font-bold text-ink-2 hover:text-ink"
            >
              <IconSwap id={note === "copied" ? "copied" : "copy"}>
                {note === "copied" ? <Check className="size-4 text-[var(--ok)]" strokeWidth={2.5} nonScalingStroke /> : <Copy className="size-4" strokeWidth={2.5} nonScalingStroke />}
              </IconSwap>
              {note === "copied" ? "Скопировано" : "Скопировать"}
            </button>
          </div>
          {/* the message as a chat bubble: what the visitor is about to send */}
          <p className="mt-2 rounded-[14px] rounded-bl-[4px] bg-surface-2 px-4 py-3 text-ui leading-body whitespace-pre-line text-ink">{text}</p>
        </div>
      )}
      <ul className="grid grid-cols-2 gap-2.5 sm:gap-3">
        {list.map((l) => (
          <li key={l.brand}>
            <a
              href={l.href}
              target={l.brand === "call" ? undefined : "_blank"}
              rel={l.brand === "call" ? undefined : "noopener noreferrer"}
              onClick={(e) => open(e, l)}
              style={brandStyle(l.brand)}
              className={`group flex min-h-14 items-center justify-center gap-2.5 rounded-full px-4 text-body font-bold text-white transition-transform duration-150 [background:var(--bf)] hover:-translate-y-0.5 sm:text-body-lg ${
                l.brand === "tiktok" ? "shadow-[-2px_-2px_0_#25F4EE,2px_2px_0_#FE2C55]" : ""
              }`}
            >
              <BrandIcon brand={l.brand} tone={l.brand === "tiktok" ? "brand" : "current"} className="size-[22px] shrink-0" />
              {l.label}
              <ArrowUpRight className="hidden size-4 shrink-0 opacity-70 transition-opacity group-hover:opacity-100 sm:block" strokeWidth={2.5} nonScalingStroke />
            </a>
          </li>
        ))}
      </ul>
      {/* said only after a tap on VK, MAX or TikTok, when the text waits on the clipboard */}
      <p aria-live="polite" className="mt-3 min-h-0 text-ui leading-snug font-bold text-ink empty:hidden">
        {note === "paste" && (
          <span className="inline-flex items-start gap-1.5">
            <Check className="mt-0.5 size-4 shrink-0 text-[var(--ok)]" strokeWidth={2.5} nonScalingStroke />
            Текст скопирован. В чате зажмите поле ввода и нажмите «Вставить».
          </span>
        )}
      </p>
    </div>
  );
}
