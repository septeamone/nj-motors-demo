"use client";

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
