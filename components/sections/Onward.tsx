import Link from "next/link";

export type OnwardLink = {
  href: string;
  /** リンクの文言。行き先の内容が分かることばで書く（「こちら」「詳しくはこちら」にしない） */
  label: string;
  /** 行き先で分かること（短く） */
  note?: string;
};

/**
 * 次に読むページへの案内。カードにせず、罫で区切った大きな行にする。
 * ページの最後に置く。孤立したページを作らないための、内部リンクの受け皿でもある。
 * 載せると、題名が少し右へ動き、矢印が先へ進む。
 */
export function Onward({ title = "あわせて読む", links, headingLevel = 2 }: { title?: string; links: OnwardLink[]; headingLevel?: 2 | 3 }) {
  const H = headingLevel === 2 ? "h2" : "h3";
  return (
    <nav aria-label={title}>
      <H className="t-kicker">{title}</H>
      <ul className="rows mt-6" data-reveal="rows">
        {links.map((link) => (
          <li key={link.href}>
            <Link href={link.href} className="group grid gap-x-8 gap-y-1 py-7 md:grid-cols-[minmax(0,6fr)_minmax(0,5fr)_auto] md:items-baseline md:py-9">
              <span className="font-[family-name:var(--font-mincho)] text-[1.1875rem] leading-[1.7] tracking-[0.06em] text-ink transition-transform duration-[900ms] ease-quiet group-hover:translate-x-2 motion-reduce:transition-none md:text-[1.5rem]">
                {link.label}
              </span>
              {link.note && <span className="text-[0.875rem] leading-[1.9] text-ink-2">{link.note}</span>}
              <span
                aria-hidden="true"
                className="hidden h-px w-12 origin-left self-center bg-ink/50 transition-transform duration-[900ms] ease-quiet group-hover:scale-x-150 motion-reduce:transition-none md:block"
              />
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
