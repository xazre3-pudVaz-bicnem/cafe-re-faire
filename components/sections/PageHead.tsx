import type { ReactNode } from "react";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Lines } from "@/components/ui/Lines";
import type { Crumb } from "@/lib/schema";

/**
 * 下層ページの冒頭。パンくず・小さな欧文のラベル・見出し（h1）・短い説明だけ。
 * ボタンや問い合わせの案内は置かない。
 *
 * 見出しは大きく左に、説明は右下に小さく置く（PC）。見出しは、行ごとに下からせり上がって現れる
 * （JS を待たない。CSS の .page-head）。
 *
 * title … 見出し。意味のまとまりごとの配列で渡すと、まとまりごとに1行になる。
 */
export function PageHead({
  crumbs,
  label,
  title,
  lead,
  children,
}: {
  crumbs: Crumb[];
  /** 見出しの上に小さく置く欧文（Menu・About など）。飾りではなく、ページの名前 */
  label?: string;
  title: ReactNode | ReactNode[];
  lead?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="page-head wrap">
      <Breadcrumbs crumbs={crumbs} />
      <div className="mt-8 grid gap-y-8 md:mt-14 lg:grid-cols-12 lg:items-end lg:gap-x-8">
        <div className="lg:col-span-8">
          {label && <p className="t-label head-fade">{label}</p>}
          <h1 className={`t-h1 ${label ? "mt-4 md:mt-5" : ""}`}>{Array.isArray(title) ? <Lines lines={title} /> : <Lines lines={[title]} />}</h1>
        </div>
        {lead && <p className="t-lead head-fade lg:col-span-4 lg:pb-[0.6em]">{lead}</p>}
      </div>
      {children}
    </div>
  );
}
