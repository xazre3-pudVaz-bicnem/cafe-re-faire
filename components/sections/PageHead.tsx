import type { ReactNode } from "react";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import type { Crumb } from "@/lib/schema";

/**
 * 下層ページの冒頭。パンくず・見出し（h1）・短い説明だけ。
 * ボタンや問い合わせの案内は置かない。
 */
export function PageHead({ crumbs, title, lead, children }: { crumbs: Crumb[]; title: ReactNode; lead?: ReactNode; children?: ReactNode }) {
  return (
    <div className="page-head wrap">
      <Breadcrumbs crumbs={crumbs} />
      <h1 className="t-h1 mt-8 md:mt-12">{title}</h1>
      {lead && <p className="t-lead measure mt-7 md:mt-9">{lead}</p>}
      {children}
    </div>
  );
}
