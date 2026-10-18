const nf = new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 });

// ru-RU groups thousands with a narrow no-break space; the display font draws it too tightly,
// so use a regular no-break space instead.
export const fmt = (n: number) => nf.format(Math.round(n)).replace(/ /g, " ");
export const rub = (n: number) => `${fmt(n)} ₽`;
export const km = (n: number) => `${fmt(n)} км`;

export function plural(n: number, forms: [string, string, string]) {
  const a = n % 100;
  const b = n % 10;
  if (a > 10 && a < 20) return forms[2];
  if (b === 1) return forms[0];
  if (b >= 2 && b <= 4) return forms[1];
  return forms[2];
}
