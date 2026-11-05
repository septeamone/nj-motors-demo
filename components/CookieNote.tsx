"use client";

import { useEffect, useState } from "react";
import { asset } from "@/lib/asset";

const KEY = "cookie-ok";

/**
 * The cookie notice: once per visitor, a small card at the bottom (above the phone's bottom bar), one button.
 * It waits for the intro to open and a moment more, so it never covers the first impression.
 */
export function CookieNote() {
  const [show, setShow] = useState(false);
  const [on, setOn] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(KEY)) return;
    } catch {
      return;
    }
    let t = 0;
    const appear = () => {
      t = window.setTimeout(() => {
        setShow(true);
        requestAnimationFrame(() => requestAnimationFrame(() => setOn(true)));
      }, 1500);
    };
    const intro = ["play", "glide"].includes(document.documentElement.dataset.intro ?? "");
    if (intro) window.addEventListener("intro-end", appear, { once: true });
    else appear();
    return () => {
      window.removeEventListener("intro-end", appear);
      window.clearTimeout(t);
    };
  }, []);

  if (!show) return null;

  const close = () => {
    try {
      localStorage.setItem(KEY, "1");
    } catch {}
    setOn(false);
    window.setTimeout(() => setShow(false), 150);
  };

  return (
    <div
      role="region"
      aria-label="Уведомление о cookie"
      className={`fixed inset-x-3 bottom-[92px] z-50 mx-auto flex max-w-[480px] items-center gap-4 rounded-[8px] bg-surface p-4 text-ui leading-body text-ink-2 shadow-[0_12px_40px_rgba(0,0,0,0.45)] transition-[opacity,translate] ease-out lg:right-auto lg:bottom-6 lg:left-6 lg:mx-0 lg:max-w-[440px] ${
        on ? "translate-y-0 opacity-100 duration-300" : "translate-y-3 opacity-0 duration-150"
      }`}
      style={{ marginBottom: "env(safe-area-inset-bottom)" }}
    >
      <p className="min-w-0 flex-1">
        Сайт использует cookie и Яндекс Метрику, чтобы понимать, как им пользуются.{" "}
        <a href={asset("/privacy/")} className="underline decoration-line-strong underline-offset-4 hover:text-ink">
          Подробнее
        </a>
      </p>
      <button type="button" onClick={close} className="btn btn-primary btn-sm shrink-0">
        Хорошо
      </button>
    </div>
  );
}
