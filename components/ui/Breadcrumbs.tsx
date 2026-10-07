import Link from "next/link";
import type { Crumb } from "@/lib/schema";

/** パンくず。最後の項目（いまのページ）はリンクにしない */
export function Breadcrumbs({ crumbs }: { crumbs: Crumb[] }) {
  return (
    <nav aria-label="パンくずリスト">
      <ol className="flex flex-wrap items-center gap-x-2 text-[0.75rem] leading-[1.8] tracking-[0.08em] text-mute">
        {crumbs.map((c, i) => {
          const last = i === crumbs.length - 1;
          return (
            <li key={c.path} className="flex min-w-0 items-center gap-x-2">
              {i > 0 && (
                <span aria-hidden="true" className="text-line">
                  /
                </span>
              )}
              {last ? (
                <span aria-current="page" className="truncate">
                  {c.name}
                </span>
              ) : (
                <Link href={c.path} className="inline-flex min-h-11 items-center hover:text-ink">
                  {c.name}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
