// Puts lib/icons.json into design/icons.html (the standalone icon sheet). Usage: node scripts/build-icons-page.mjs
import { readFileSync, writeFileSync } from "node:fs";

const groups = JSON.parse(readFileSync("lib/icons.json", "utf8"));
const data = Object.fromEntries(groups.map((g) => [g.group, g.icons.map((i) => [i.id, i.name, i.meaning, i.svg])]));
const html = readFileSync("design/icons.html", "utf8");
const out = html.replace(/const ICONS = [\s\S]*?\r?\n};\r?\n/, () => `const ICONS = ${JSON.stringify(data, null, 1)};\n`);
if (out === html) throw new Error("ICONS block not found");
writeFileSync("design/icons.html", out);
