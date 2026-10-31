"use client";

import { VIA, VIA_BRAND, type Via } from "@/lib/lead";
import { SITE, telHref } from "@/lib/site";
import { BRAND, BrandIcon, type Brand } from "./BrandIcon";

// each chip and button wears its own brand: tinted when idle, filled when chosen
const brandStyle = (b: Brand) => ({ "--b": BRAND[b].color, "--bf": BRAND[b].fill }) as React.CSSProperties;
const CHIP =
  "group inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full border-[1.5px] border-[var(--b)] bg-[color-mix(in_srgb,var(--b)_14%,transparent)] px-3.5 text-[16px] font-bold text-ink transition-[background,color,transform] duration-150 hover:bg-[color-mix(in_srgb,var(--b)_26%,transparent)]";

/** "Where is it convenient to talk": four chips in the messengers' own colours, one chosen. */
export function ViaPicker({ value, onChange, id }: { value: Via; onChange: (v: Via) => void; id: string }) {
  return (
    <div>
      <p id={id} className="label">
        Где удобно связаться
      </p>
      <div role="radiogroup" aria-labelledby={id} className="mt-2 flex flex-wrap gap-2">
        {VIA.map((o) => (
          <button
            key={o}
            type="button"
            role="radio"
            aria-checked={value === o}
            onClick={() => onChange(o)}
            style={brandStyle(VIA_BRAND[o])}
            className={`${CHIP} aria-checked:border-transparent aria-checked:text-white aria-checked:[background:var(--bf)]`}
          >
            <BrandIcon brand={VIA_BRAND[o]} tone={value === o ? "current" : "brand"} className="size-5 text-[var(--b)] group-aria-checked:text-white" />
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Links that open the call or the chat with Andrey at once (from site.json; a missing one shows but does nothing yet). */
function directLinks(): { brand: Brand; label: string; href: string | null }[] {
  const c = SITE.contacts;
  const digits = (v: string) => v.replace(/\D/g, "");
  const tel = c.phone ? telHref(c.phone) : null;
  const wa = c.whatsapp ?? c.phone;
  return [
    { brand: "call", label: "Позвонить", href: tel },
    { brand: "whatsapp", label: "WhatsApp", href: wa ? `https://wa.me/${digits(wa).replace(/^8(?=\d{10}$)/, "7")}` : null },
    { brand: "telegram", label: "Telegram", href: c.telegram ? `https://t.me/${c.telegram.replace(/^@|^https?:\/\/t\.me\//, "")}` : null },
    { brand: "max", label: "MAX", href: c.max && /^https?:\/\//.test(c.max) ? c.max : null },
  ];
}

/** "Contact directly": a call opens the phone's dialler with Andrey's number already in it, the rest open the chat. */
export function DirectContacts({ className = "" }: { className?: string }) {
  const links = directLinks();
  const ready = links.some((l) => l.href);
  return (
    <div className={className}>
      <p className="label">Или свяжитесь с Андреем напрямую</p>
      <ul className="mt-3 flex flex-wrap gap-2">
        {links.map((l) => (
          <li key={l.brand}>
            {l.href ? (
              <a
                href={l.href}
                target={l.brand === "call" ? undefined : "_blank"}
                rel={l.brand === "call" ? undefined : "noopener noreferrer"}
                style={brandStyle(l.brand)}
                className="inline-flex min-h-12 items-center gap-2.5 rounded-full px-5 text-[16px] font-bold text-white transition-transform duration-150 [background:var(--bf)] hover:-translate-y-0.5"
              >
                <BrandIcon brand={l.brand} className="size-5" />
                {l.label}
              </a>
            ) : (
              <span
                aria-disabled
                title="Появится после подтверждения"
                style={brandStyle(l.brand)}
                className="inline-flex min-h-12 cursor-default items-center gap-2.5 rounded-full px-5 text-[16px] font-bold text-white opacity-80 [background:var(--bf)]"
              >
                <BrandIcon brand={l.brand} className="size-5" />
                {l.label}
              </span>
            )}
          </li>
        ))}
      </ul>
      {!ready && <p className="mt-2 text-[15px] text-ink-2">Номер и ссылки появятся после подтверждения. Пока: заявка в форме.</p>}
    </div>
  );
}
