import type { Metadata } from "next";
import { Onward } from "@/components/sections/Onward";
import { navKeys, pages } from "@/data/pages";
import { site } from "@/data/site";

export const metadata: Metadata = {
  title: { absolute: `ページが見つかりません｜${site.name}` },
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <main id="main">
      <div className="page-head wrap">
        <h1 className="t-h1">ページが見つかりません</h1>
        <p className="t-lead measure mt-7">お探しのページは、移動したか、なくなった可能性があります。下のページからお探しください。</p>
      </div>
      <section className="section">
        <div className="wrap">
          <Onward
            title="ページの一覧"
            links={[pages.home, ...navKeys.map((k) => pages[k])].map((p) => ({ href: p.path, label: p.anchor, note: p.anchorNote }))}
          />
        </div>
      </section>
    </main>
  );
}
