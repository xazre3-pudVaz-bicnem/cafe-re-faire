"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Item = { href: string; label: string };

/** ヘッダーのメニュー（PC）。いまいるページに、扉の水色の線を引く。載せると、下線が左から引かれる */
export function NavLinks({ items }: { items: Item[] }) {
  const pathname = usePathname();
  return (
    <ul className="flex items-center gap-x-9 xl:gap-x-12">
      {items.map((item) => {
        const current = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <li key={item.href}>
            <Link href={item.href} className="nav-link" aria-current={current ? "page" : undefined}>
              <span className="ul">{item.label}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
