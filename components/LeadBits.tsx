"use client";

import { VIA, type Via } from "@/lib/lead";

/** "Where is it convenient to talk": four chips, one chosen. */
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
            className="min-h-11 cursor-pointer rounded-full border border-line-strong px-4 text-[16px] font-bold text-ink-2 transition-[color,background-color,border-color] duration-150 hover:border-accent hover:text-ink aria-checked:border-accent aria-checked:bg-accent-soft aria-checked:text-ink"
          >
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}
