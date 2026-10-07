import Link from "next/link";
import { navKeys, pages } from "@/data/pages";
import { closedLine, fullAddress, site, sundayHours, weekdayHours } from "@/data/site";
import { HeaderScroll } from "./HeaderScroll";
import { MenuDialog } from "./MenuDialog";
import { NavLinks } from "./NavLinks";

/**
 * ヘッダー。左に店名、右に4つのメニュー。予約や問い合わせのボタンは置かない。
 *
 * overHero はトップページ専用。最初の画面では写真の上に透けて重なり、店名を出さない
 * （ヒーローに大きく出ているため）。ヒーローを過ぎると、通常の表示になる。
 */
export function Header({ overHero = false }: { overHero?: boolean }) {
  const nav = navKeys.map((key) => ({ href: pages[key].path, label: pages[key].label }));

  return (
    <header className="site-header" data-over-hero={overHero ? "" : undefined}>
      <a href="#main" className="sr-only-focusable">
        本文へ移動
      </a>
      <div className="wrap flex h-full items-center justify-between gap-6">
        <Link href="/" className="hide-on-hero flex min-h-11 shrink-0 items-center">
          <span className="latin-i text-[1.5rem] leading-none lg:text-[1.625rem]">{site.name}</span>
          <span className="sr-only">（トップページへ）</span>
        </Link>

        <div className="flex items-center">
          <nav aria-label="メインメニュー" className="hidden lg:block">
            <NavLinks items={nav} />
          </nav>

          <MenuDialog>
            <div className="wrap flex min-h-[calc(100%-4rem)] flex-col pb-10 pt-4">
              <p className="latin-i text-[2rem] leading-none text-ink">{site.name}</p>
              <nav aria-label="メニュー" className="mt-9">
                <ul className="rows">
                  <li>
                    <Link href="/" className="flex min-h-[3.75rem] items-center font-[family-name:var(--font-mincho)] text-[1.125rem] tracking-[0.14em] text-ink">
                      {pages.home.label}
                    </Link>
                  </li>
                  {nav.map((item) => (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className="flex min-h-[3.75rem] items-center font-[family-name:var(--font-mincho)] text-[1.125rem] tracking-[0.14em] text-ink"
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>

              <address className="t-note mt-auto pt-12">
                <p>{fullAddress}</p>
                <p>
                  {weekdayHours}／日曜・祝日 {sundayHours}
                </p>
                <p>定休日 {closedLine}</p>
              </address>
            </div>
          </MenuDialog>
        </div>
      </div>
      {overHero && <HeaderScroll />}
    </header>
  );
}
