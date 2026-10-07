import Link from "next/link";
import { MapEmbed } from "@/components/sections/MapEmbed";
import { ShopFacts } from "@/components/sections/ShopFacts";
import { Photo } from "@/components/ui/Photo";
import { pages } from "@/data/pages";
import { photos } from "@/data/photos";
import { site } from "@/data/site";

/**
 * 08 店舗情報 ＋ 09 地図。
 * 載せるのは、確かめられた情報だけ（data/site.ts）。細かい行き方は、アクセスのページに任せる。
 */
export function Information() {
  return (
    <section className="section" id="information">
      <div className="wrap grid gap-y-12 lg:grid-cols-12 lg:gap-x-8">
        <div className="lg:col-span-5">
          <h2 className="t-h2">
            <span className="ib">営業時間と</span>
            <span className="ib">アクセス</span>
          </h2>
          <div className="mt-10 hidden lg:block">
            <Photo photo={photos.parkingSign} ratio="4/3" sizes="(max-width: 1023px) 0px, 36vw" />
            <p className="caption">外壁の水色の看板が目印。駐車場は、矢印の方向です。</p>
          </div>
        </div>

        <div className="lg:col-span-6 lg:col-start-7">
          <ShopFacts withAccessLinks />
          <p className="mt-8">
            <Link href={pages.access.path} className="more">
              行き方と駐車場の案内
            </Link>
          </p>
        </div>
      </div>

      {site.map.embedUrl && (
        <div className="wrap mt-16 md:mt-24">
          <h3 className="sr-only">{site.name}の地図</h3>
          <MapEmbed embedUrl={site.map.embedUrl} title={`${site.name}の地図`} />
          <p className="mt-4">
            <a href={site.map.linkUrl} target="_blank" rel="noopener noreferrer" className="more">
              Googleマップで開く
              <span className="sr-only">（別のタブで開きます）</span>
            </a>
          </p>
        </div>
      )}
    </section>
  );
}
