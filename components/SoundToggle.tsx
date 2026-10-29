"use client";

import { Volume2, VolumeX } from "lucide-react";
import { useEffect, useState } from "react";
import { loadSound, setSound } from "@/lib/sound";

/** Turns the site's sounds on and off (off by default): the engine starts when they are turned on. */
export function SoundToggle({ className = "grid" }: { className?: string }) {
  const [on, setOn] = useState(false);
  useEffect(() => {
    // the saved choice is only readable after mount
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOn(loadSound());
  }, []);
  return (
    <button
      type="button"
      aria-pressed={on}
      aria-label={on ? "Выключить звук" : "Включить звук"}
      title={on ? "Выключить звук" : "Включить звук"}
      onClick={() => {
        setSound(!on);
        setOn(!on);
      }}
      className={`${className} size-11 place-items-center rounded-full bg-ink/[0.07] text-ink-3 transition-[color,transform] duration-150 hover:text-ink active:scale-95 aria-pressed:text-accent-ink`}
    >
      {on ? <Volume2 className="size-5" strokeWidth={2} /> : <VolumeX className="size-5" strokeWidth={2} />}
    </button>
  );
}
