"use client";

import { useEffect, useState } from "react";
import { NjIcon, type IconName } from "./NjIcon";

type Theme = "light" | "dark";
const KEY = "site-theme";

const OPTIONS: { value: Theme; label: string; icon: IconName }[] = [
  { value: "light", label: "Светлая тема", icon: "sun" },
  { value: "dark", label: "Тёмная тема", icon: "moon" },
];

function apply(t: Theme) {
  const set = () => {
    document.documentElement.dataset.theme = t;
  };
  // View Transitions crossfade a GPU snapshot instead of animating every element.
  if (document.startViewTransition) document.startViewTransition(set);
  else set();
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
