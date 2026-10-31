import { SITE } from "./site";

/** How the visitor wants to be contacted (every form offers the same choice). */
export const VIA = ["Звонок", "WhatsApp", "Telegram", "MAX"] as const;
export type Via = (typeof VIA)[number];

/** A phone number with at least 10 digits (+7 900 000-00-00). */
export const phoneOk = (v: string) => v.replace(/\D/g, "").length >= 10;

/**
 * Sends a request to the receiver set in site.json (form.endpoint). Until one is connected, the local preview
 * pretends to send and a production build says honestly that nothing was delivered.
 */
export async function sendLead(data: Record<string, unknown>): Promise<"success" | "error"> {
  const endpoint = SITE.form.endpoint;
  if (!endpoint) {
    if (process.env.NODE_ENV !== "production") {
      await new Promise((r) => setTimeout(r, 1200));
      return "success";
    }
    return "error";
  }
  try {
    const r = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      signal: AbortSignal.timeout(10000),
      body: JSON.stringify({ ...data, source: "njmotors-landing" }),
    });
    if (!r.ok) throw new Error(String(r.status));
    navigator.vibrate?.([20, 60, 35]);
    return "success";
  } catch {
    return "error";
  }
}

/** The honest note shown when a request could not be delivered. */
export const sendError = (hasContacts: boolean) =>
  `${SITE.form.endpoint ? "Не получилось отправить заявку. Проверьте соединение и попробуйте ещё раз" : "Заявка не отправлена: приём заявок ещё не подключён"}${hasContacts ? " или свяжитесь с нами напрямую" : ""}.`;
