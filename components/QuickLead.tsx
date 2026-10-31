"use client";

import { ArrowRight, CheckCircle2, Loader2, TriangleAlert } from "lucide-react";
import { useId, useState } from "react";
import { asset } from "@/lib/asset";
import { phoneOk, sendError, sendLead, type Via } from "@/lib/lead";
import { channels } from "@/lib/site";
import { ViaPicker } from "./LeadBits";

/**
 * A short request in the middle of the page: a phone and where to talk, one button. The full form waits at the end;
 * this one is for the visitor who has already decided. `extra` travels with the request (e.g. quiz answers).
 */
export function QuickLead({ form, button = "Жду связи", extra }: { form: string; button?: string; extra?: Record<string, string> }) {
  const id = useId();
  const [phone, setPhone] = useState("");
  const [via, setVia] = useState<Via>("Звонок");
  const [err, setErr] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  if (status === "success")
    return (
      <p role="status" className="flex items-center gap-3 text-[17px] font-bold text-ink">
        <CheckCircle2 className="size-7 shrink-0 text-[var(--ok)]" strokeWidth={1.5} />
        Заявка принята. Андрей свяжется: {via === "Звонок" ? "позвонит" : `напишет в ${via}`}.
      </p>
    );

  const submit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!phoneOk(phone)) {
      setErr("Телефон с кодом: +7 900 000-00-00");
      document.getElementById(`${id}-phone`)?.focus();
      return;
    }
    setStatus("loading");
    setStatus(await sendLead({ form, contact: phone, via, consent: true, ...extra }));
  };

  return (
    <form onSubmit={submit} noValidate className="grid gap-4">
      <ViaPicker id={`${id}-via`} value={via} onChange={setVia} />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <div className="min-w-0 flex-1">
          <label htmlFor={`${id}-phone`} className="sr-only">
            Телефон
          </label>
          <div className="field" data-invalid={!!err}>
            <input
              id={`${id}-phone`}
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                setErr("");
              }}
              placeholder="Телефон: +7 900 000-00-00"
              aria-invalid={!!err}
              aria-describedby={err ? `${id}-err` : undefined}
            />
          </div>
          {err && (
            <p id={`${id}-err`} role="alert" className="mt-2 text-[16px] text-[var(--danger)]">
              {err}
            </p>
          )}
        </div>
        <button type="submit" disabled={status === "loading"} className="btn btn-primary h-[52px] shrink-0">
          {status === "loading" ? <Loader2 className="size-5 animate-spin" strokeWidth={2} /> : <>{button}<ArrowRight className="size-[18px]" strokeWidth={2} /></>}
        </button>
      </div>
      <p className="text-[14px] leading-snug text-ink-3">
        Нажимая кнопку, вы соглашаетесь с{" "}
        <a href={asset("/privacy/")} target="_blank" rel="noopener" className="underline decoration-line-strong underline-offset-4 hover:text-ink">
          политикой конфиденциальности
        </a>
        .
      </p>
      {status === "error" && (
        <p role="alert" className="flex gap-3 text-[16px] leading-snug text-ink">
          <TriangleAlert className="mt-0.5 size-4 shrink-0 text-[var(--danger)]" strokeWidth={1.75} />
          {sendError(channels().length > 0)}
        </p>
      )}
    </form>
  );
}
