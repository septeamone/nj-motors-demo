const nf = new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 });

// ru-RU groups thousands with a narrow no-break space; the display font draws it too tightly,
// so use a regular no-break space instead.
export const fmt = (n: number) => nf.format(Math.round(n)).replace(/ /g, " ");
export const rub = (n: number) => `${fmt(n)} ₽`;
export const km = (n: number) => `${fmt(n)} км`;
