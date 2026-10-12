import Link from "next/link";
import { Hours } from "@/components/sections/Hours";
import { MapEmbed } from "@/components/sections/MapEmbed";
import { ShopFacts } from "@/components/sections/ShopFacts";
import { Lines } from "@/components/ui/Lines";
import { Photo } from "@/components/ui/Photo";
import { pages } from "@/data/pages";
import { photos } from "@/data/photos";
import { site } from "@/data/site";

/**
 * 08 店舗情報 ＋ 09 地図。
 * 載せるのは、確かめられた情報だけ（data/site.ts）。細かい行き方は、アクセスのページに任せる。
 *
 * 組み方：文字が主役。営業時間を大きな数字で見せ、その下に、住所・定休日・駐車場・電話・Instagram を表でまとめる。
 * 最後に、地図を区画の幅いっぱいに置く。
 */
export function Information() {
  return (
    <section className="section" id="information">
      <div className="wide">
        <p className="t-label" data-reveal="wipe">
          <span className="inline-block">
            <span className="n">05</span>Access
          </span>
        </p>

        <div className="mt-5 grid gap-y-10 lg:mt-7 lg:grid-cols-12 lg:gap-x-8">
          <h2 className="t-display lg:col-span-5" data-reveal="lines">
            <Lines lines={["営業時間と", "アクセス"]} />
          </h2>
          <div className="lg:col-span-6 lg:col-start-7 lg:pt-3">
            <Hours />
          </div>
        </div>

        <div className="mt-16 grid gap-y-12 lg:mt-28 lg:grid-cols-12 lg:gap-x-8">
          <div className="hidden lg:col-span-4 lg:block">
            <Photo photo={photos.parkingSign} ratio="4/5" position="52% 50%" parallax={30} sizes="(max-width: 1023px) 0px, 30vw" />
            <p className="caption">外壁の水色の看板が目印。駐車場は、矢印の方向です。</p>
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
      </div>

      {site.map.embedUrl && (
        <div className="mt-16 md:mt-28">
          <h3 className="sr-only">{site.name}の地図</h3>
          <MapEmbed embedUrl={site.map.embedUrl} title={`${site.name}の地図`} />
          <p className="wide mt-4">
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
