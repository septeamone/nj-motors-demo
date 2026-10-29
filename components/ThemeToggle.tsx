"use client";

import { useEffect, useState } from "react";
import { NjIcon, type IconName } from "./NjIcon";

type Theme = "light" | "dark";
const KEY = "site-theme";

const OPTIONS: { value: Theme; label: string; icon: IconName }[] = [
  { value: "light", label: "Светлая тема", icon: "sun" },
  { value: "dark", label: "Тёмная тема", icon: "moon" },
];

/**
 * The theme changes at once: the whole page repaints in one frame with every colour transition switched off (so
 * nothing on the page fades on its own schedule), and only the switch itself moves.
 */
function apply(t: Theme) {
  const root = document.documentElement;
  root.classList.add("theme-swap");
  root.dataset.theme = t;
  // let the new colours land before transitions come back
  void root.offsetHeight;
  requestAnimationFrame(() => root.classList.remove("theme-swap"));
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
    <div role="radiogroup" aria-label="Тема оформления" className="relative flex items-center gap-0.5 rounded-full bg-ink/[0.07] p-[3px]">
      {/* the thumb slides under the chosen icon */}
      <span
        aria-hidden
        className="absolute top-[3px] left-[3px] size-9 rounded-full bg-surface shadow-[0_1px_2px_rgba(0,0,0,0.3)] transition-transform duration-300 ease-[cubic-bezier(0.23,1,0.32,1)]"
        style={{ transform: theme === "dark" ? "translateX(calc(100% + 2px))" : "none" }}
      />
      {OPTIONS.map(({ value, label, icon }) => (
        <button
          key={value}
          type="button"
          role="radio"
          aria-checked={theme === value}
          aria-label={label}
          title={label}
          onClick={() => choose(value)}
          className="relative grid size-9 place-items-center rounded-full text-ink-3 transition-colors hover:text-ink aria-checked:text-ink"
        >
          <NjIcon name={icon} className="size-[22px]" />
        </button>
      ))}
    </div>
  );
}
