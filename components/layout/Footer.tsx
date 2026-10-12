import Link from "next/link";
import { Wordmark } from "@/components/ui/Wordmark";
import { navKeys, pages } from "@/data/pages";
import { closedLine, fullAddress, site, sundayHours, telHref, weekdayHours } from "@/data/site";

/**
 * フッター。黒い外壁の色の上に、店名を幅いっぱいに置く。その上に、住所・営業時間・Instagram を小さく。
 * 住所と電話は、全ページで同じ書き方になるよう data/site.ts から出す（NAP の統一）。
 */
export function Footer() {
  return (
    <footer className="site-footer">
      <div className="grid gap-y-10 px-[var(--gutter)] pt-20 text-[0.875rem] leading-[2] md:grid-cols-12 md:gap-x-8 md:pt-28 lg:pt-32">
        <div className="md:col-span-5 lg:col-span-4">
          <p className="t-label">Address</p>
          <address className="mt-3">
            <p>{fullAddress}</p>
            {site.phone && telHref && (
              <p>
                電話{" "}
                <a href={telHref} className="inline-flex min-h-11 items-center">
                  <span className="ul">{site.phone.display}</span>
                </a>
              </p>
            )}
          </address>
        </div>

        <div className="md:col-span-7 lg:col-span-5">
          <p className="t-label">Open</p>
          <div className="mt-3">
            <p>
              営業時間 {weekdayHours}
              <span className="mx-[0.5em] opacity-40" aria-hidden="true">
                /
              </span>
              日曜・祝日 {sundayHours}
            </p>
            <p>定休日 {closedLine}</p>
          </div>
        </div>

        <div className="md:col-span-12 lg:col-span-3">
          <p className="t-label">Instagram</p>
          <p className="mt-1">
            <a href={site.instagram.url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center">
              <span className="ul">@{site.instagram.handle}</span>
              <span className="sr-only">（別のタブで開きます）</span>
            </a>
          </p>
        </div>
      </div>

      <p className="mt-16 px-[var(--gutter)] md:mt-24">
        <Link href="/" className="footer-mark">
          <Wordmark />
        </Link>
      </p>

      <div className="flex flex-col gap-y-6 px-[var(--gutter)] pb-8 pt-8 md:flex-row md:items-end md:justify-between md:pb-10 md:pt-10">
        <p className="text-[0.75rem] tracking-[0.24em]">{site.reading}</p>
        <nav aria-label="フッターメニュー">
          <ul className="flex justify-between text-[0.75rem] tracking-[0.1em] md:justify-start md:gap-x-9 md:text-[0.8125rem] md:tracking-[0.14em]">
            <li>
              <Link href="/" className="inline-flex min-h-11 items-center">
                <span className="ul">{pages.home.label}</span>
              </Link>
            </li>
            {navKeys.map((key) => (
              <li key={key}>
                <Link href={pages[key].path} className="inline-flex min-h-11 items-center">
                  <span className="ul">{pages[key].label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <p className="text-[0.75rem] tracking-[0.08em] opacity-70">&copy; {site.name}</p>
      </div>
    </footer>
  );
}
