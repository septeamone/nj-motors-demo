/** Russian typesetting: a short word never ends a line, and a number stays with its unit or dash. */
export function nb(text: string): string {
  return text
    .replace(/(^|[\s(«„])([А-Яа-яЁёA-Za-z]{1,2})\s+(?=\S)/g, "$1$2 ")
    .replace(/(\d)\s+(?=(?:нед|дн|мес|лет|год|₽|л\.с|см|км|%|тыс|млн))/g, "$1 ")
    .replace(/\s+—/g, " —");
}
