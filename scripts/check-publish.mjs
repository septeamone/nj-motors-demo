// Lists everything that is still a placeholder and must be confirmed by NJ Motors before the site goes public.
import { readFileSync } from "node:fs";

const site = JSON.parse(readFileSync(new URL("../lib/site.json", import.meta.url), "utf8"));
const missing = [];

for (const [key, value] of Object.entries(site.contacts)) {
  if (!value) missing.push(`contacts.${key}: not set (the site shows only confirmed contacts)`);
}
if (!site.form.endpoint) missing.push("form.endpoint: no receiver connected, requests are NOT delivered anywhere");
if (!site.pricesConfirmed) missing.push("pricesConfirmed: catalog prices and calculator rates are sample figures; confirm or replace them in lib/data.ts and lib/calc.ts");

if (missing.length) {
  console.log("Not ready to publish. Still to confirm:\n");
  for (const m of missing) console.log(" -", m);
  process.exit(1);
}
console.log("All placeholders are confirmed.");
