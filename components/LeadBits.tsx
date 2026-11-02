"use client";

import { asset } from "@/lib/asset";
import { VIA, VIA_BRAND, type Via } from "@/lib/lead";
import { BRAND, BrandIcon, type Brand } from "./BrandIcon";

// each chip and button wears its own brand: tinted when idle, filled when chosen
const brandStyle = (b: Brand) => ({ "--b": BRAND[b].color, "--bf": BRAND[b].fill }) as React.CSSProperties;
const CHIP =
  "group inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full border-[1.5px] border-[var(--b)] bg-[color-mix(in_srgb,var(--b)_14%,transparent)] px-3.5 text-[16px] font-bold text-ink transition-[background,color,transform] duration-150 hover:bg-[color-mix(in_srgb,var(--b)_26%,transparent)]";

/** "Where shall we answer you": four chips in the messengers' own colours, one chosen. */
export function ViaPicker({ value, onChange, id }: { value: Via; onChange: (v: Via) => void; id: string }) {
  return (
    <div>
      <p id={id} className="label">
        Куда вам ответить
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

const DOC_LINK = "underline decoration-line-strong underline-offset-4 hover:text-ink";

/**
 * The words beside every consent box. The box is the consent alone: since 1 September 2025 it may not be bundled with
 * other documents (152-FZ art. 9), so the policy gets its own plain line under the box (PolicyNote), outside the label.
 */
export function ConsentText() {
  return (
    <span>
      Даю{" "}
      <a href={asset("/consent/")} target="_blank" rel="noopener" className={DOC_LINK}>
        согласие на обработку персональных данных
      </a>
    </span>
  );
}

export function PolicyNote() {
  return (
    <p className="mt-1.5 pl-[30px] text-[14px] leading-snug text-ink-3 [hyphens:none]">
      Как мы обращаемся с данными — в{" "}
      <a href={asset("/privacy/")} target="_blank" rel="noopener" className={DOC_LINK}>
        политике конфиденциальности
      </a>
    </p>
  );
}
