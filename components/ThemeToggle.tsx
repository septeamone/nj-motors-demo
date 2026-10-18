"use client";

import { useEffect, useState } from "react";
import { NjIcon, type IconName } from "./NjIcon";

type Theme = "light" | "dark";
const KEY = "site-theme";

const OPTIONS: { value: Theme; label: string; icon: IconName }[] = [
  { value: "light", label: "Светлая тема", icon: "sun" },
  { value: "dark", label: "Тёмная тема", icon: "moon" },
];

const poly = (t: number) => `polygon(0 0, ${t}% 0, ${t - 30}% 100%, 0 100%)`;
const bandPoly = (t: number) => `polygon(${t - 7}% 0, ${t}% 0, ${t - 30}% 100%, ${t - 37}% 100%)`;

/** The new theme is revealed by a slanted edge sweeping across the screen, with a red strip riding on it. */
function apply(t: Theme) {
  const root = document.documentElement;
  const set = () => {
    root.dataset.theme = t;
  };
  if (!document.startViewTransition || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    set();
    return;
  }
  root.classList.add("theme-flip");
  const band = document.createElement("div");
  band.className = "theme-band";
  band.setAttribute("aria-hidden", "true");
  const run = document.startViewTransition(() => {
    set();
    document.body.appendChild(band);
  });
  run.ready.then(() => {
    const opts = { duration: 950, easing: "cubic-bezier(0.76, 0, 0.24, 1)", fill: "forwards" as const };
    root.animate({ clipPath: [poly(0), poly(140)] }, { ...opts, pseudoElement: "::view-transition-new(root)" });
    root.animate({ clipPath: [bandPoly(0), bandPoly(140)] }, { ...opts, pseudoElement: "::view-transition-new(band)" });
  });
  run.finished.finally(() => {
    band.remove();
    root.classList.remove("theme-flip");
  });
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    // The saved choice is only readable after mount, so it is synced into state here on purpose.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTheme(document.documentElement.dataset.theme === "light" ? "light" : "dark");
  }, []);

  const choose = (t: Theme) => {
    setTheme(t);
    try {
      localStorage.setItem(KEY, t);
    } catch {}
    apply(t);
  };

  return (
    <div role="radiogroup" aria-label="Тема оформления" className="flex items-center gap-0.5 rounded-full bg-ink/[0.07] p-[3px]">
      {OPTIONS.map(({ value, label, icon }) => (
        <button
          key={value}
          type="button"
          role="radio"
          aria-checked={theme === value}
          aria-label={label}
          title={label}
          onClick={() => choose(value)}
          className="grid size-9 place-items-center rounded-full text-ink-3 transition-colors hover:text-ink aria-checked:bg-surface aria-checked:text-ink aria-checked:shadow-[0_1px_2px_rgba(0,0,0,0.3)]"
        >
          <NjIcon name={icon} className="size-[22px]" />
        </button>
      ))}
    </div>
  );
}
