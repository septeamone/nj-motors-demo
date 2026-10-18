import groups from "@/lib/icons.json";

const SVG: Record<string, string> = Object.fromEntries(groups.flatMap((g) => g.icons.map((i) => [i.id, i.svg])));

export type IconName = (typeof groups)[number]["icons"][number]["id"];

/** NJ Motors icon set (design/icons.html): thick round line in the text colour, one offset red plate. */
export function NjIcon({ name, className = "size-6" }: { name: IconName; className?: string }) {
  return <svg aria-hidden viewBox="0 0 48 48" className={`nj-ic ${className}`} dangerouslySetInnerHTML={{ __html: SVG[name] }} />;
}
