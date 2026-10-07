import Link from "next/link";
import { navKeys, pages } from "@/data/pages";
import { closedLine, fullAddress, site, sundayHours, telHref, weekdayHours } from "@/data/site";

/**
 * フッター。店名・住所・営業時間・メニューだけ。
 * 住所と電話は、全ページで同じ書き方になるよう data/site.ts から出す（NAP の統一）。
 */
export function Footer() {
  return (
    <footer className="border-t border-line bg-paper-2 text-ink-2">
      <div className="wrap grid gap-y-12 py-16 lg:grid-cols-12 lg:py-20">
        <div className="lg:col-span-7">
          <p>
            <Link href="/" className="latin-i inline-flex min-h-11 items-center text-[2rem] leading-none text-ink">
              {site.name}
            </Link>
          </p>
          <p className="mt-1 text-[0.75rem] tracking-[0.24em] text-mute">{site.reading}</p>

          <address className="mt-8 text-[0.875rem] leading-[2]">
            <p>{fullAddress}</p>
            <p>
              営業時間 {weekdayHours}
              <span className="mx-[0.5em] text-line" aria-hidden="true">
                /
              </span>
              日曜・祝日 {sundayHours}
            </p>
            <p>定休日 {closedLine}</p>
            {site.phone && telHref && (
              <p>
                電話{" "}
                <a href={telHref} className="link inline-flex min-h-11 items-center">
                  {site.phone.display}
                </a>
              </p>
            )}
          </address>
        </div>

        <nav aria-label="フッターメニュー" className="lg:col-span-5 lg:justify-self-end">
          <ul className="grid grid-cols-2 gap-x-10 text-[0.875rem] tracking-[0.1em] lg:grid-cols-1">
            <li>
              <Link href="/" className="inline-flex min-h-11 items-center hover:text-ink">
                {pages.home.label}
              </Link>
            </li>
            {navKeys.map((key) => (
              <li key={key}>
                <Link href={pages[key].path} className="inline-flex min-h-11 items-center hover:text-ink">
                  {pages[key].label}
                </Link>
              </li>
            ))}
            <li>
              <a href={site.instagram.url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center hover:text-ink">
                Instagram
                <span className="sr-only">（別のタブで開きます）</span>
              </a>
            </li>
          </ul>
        </nav>
      </div>

      <div className="wrap border-t border-line py-6">
        <p className="text-[0.75rem] tracking-[0.08em] text-mute">
          &copy; {site.name}
        </p>
      </div>
    </footer>
  );
}
