/**
 * アクセス。
 *
 * 担当する検索語 … 「水沢 カフェ 駐車場」（あわせて「水沢駅 カフェ」「Cafe Re faire 営業時間」「Cafe Re faire 場所」）
 * 役割          … 行き方・営業時間・駐車場・支払い・予約。来店の前に知りたいことに答える
 * 書かないこと   … メニューの説明（/menu）。道順の細かい案内（曲がり角・所要時間の断定）は、確かめられた範囲だけ
 *
 * よくある質問（FAQPage の構造化データ）は、サイト内でこのページだけに置く。
 */
import type { Metadata } from "next";
import { MapEmbed } from "@/components/sections/MapEmbed";
import { MonthCalendar } from "@/components/sections/MonthCalendar";
import { Onward } from "@/components/sections/Onward";
import { PageHead } from "@/components/sections/PageHead";
import { ShopFacts } from "@/components/sections/ShopFacts";
import { JsonLd } from "@/components/ui/JsonLd";
import { Photo } from "@/components/ui/Photo";
import { buildFaqs } from "@/data/faq";
import { cakes } from "@/data/menu";
import { pages } from "@/data/pages";
import { photos } from "@/data/photos";
import { addressLine, parkingLine, site } from "@/data/site";
import { crumbsFor, faqNode, pageGraph } from "@/lib/schema";
import { pageMetadata } from "@/lib/seo";

const page = pages.access;

export const metadata: Metadata = pageMetadata(page);

export default function AccessPage() {
  const faqs = buildFaqs();
  const { routes, road } = site.access;
  const { landmark } = site;

  return (
    <>
      <PageHead
        crumbs={crumbsFor(page)}
        title={
          <>
            <span className="ib">アクセスと、</span>
            <span className="ib">営業時間</span>
          </>
        }
        lead={
          <>
            {site.name}は、{addressLine}。{road}にあります。{parkingLine}の駐車場があり、{site.address.area}駅からは{routes[0].car}です。
          </>
        }
      />

      {/* ---- 店舗情報と地図 ---- */}
      <section className="section no-cv" id="information">
        <div className="wrap grid gap-y-12 lg:grid-cols-12 lg:gap-x-8">
          <div className="lg:col-span-6">
            <h2 className="sr-only">店舗情報</h2>
            <ShopFacts />
          </div>
          <div className="lg:col-span-5 lg:col-start-8">
            <Photo photo={photos.parkingSign} ratio="4/3" sizes="(max-width: 1023px) 88vw, 38vw" priority />
            <p className="caption">外壁の水色の看板が目印。駐車場は、矢印の方向です。</p>
          </div>
        </div>

        {site.map.embedUrl && (
          <div className="wrap mt-14 md:mt-20">
            <h2 className="sr-only">地図</h2>
            <MapEmbed embedUrl={site.map.embedUrl} title={`${site.name}の地図`} tall />
            <p className="mt-4">
              <a href={site.map.linkUrl} target="_blank" rel="noopener noreferrer" className="more">
                Googleマップで開く
                <span className="sr-only">（別のタブで開きます）</span>
              </a>
            </p>
          </div>
        )}
      </section>

      {/* ---- 今月の営業日 ---- */}
      <section className="section no-cv" id="calendar">
        <div className="wrap grid gap-y-10 md:grid-cols-12 md:gap-x-8">
          <div className="md:col-span-4">
            <h2 className="t-h2">営業日</h2>
            <p className="measure mt-8">定休日は{site.hours.closedDay}。ほかに、出店などで休む日があります。</p>
          </div>
          <div className="md:col-span-7 md:col-start-6">
            <MonthCalendar />
          </div>
        </div>
      </section>

      {/* ---- 行き方 ---- */}
      <section className="section no-cv" id="route">
        <div className="wrap">
          <div className="grid gap-y-10 md:grid-cols-12 md:gap-x-8">
            <div className="md:col-span-5">
              <h2 className="t-h2">行き方</h2>
              <div className="measure mt-8 space-y-6">
                <p>
                  {road}。{landmark}の近くです。グレーと黒の外壁に掛かる、水色の看板を目印にしてください。
                </p>
                <p>駐車場は{parkingLine}。看板の矢印の先です。</p>
              </div>
            </div>
            <div className="md:col-span-6 md:col-start-7">
              <Photo photo={photos.exterior} ratio="4/3" className="max-md:pull-r" sizes="(max-width: 767px) 94vw, 46vw" />
            </div>
          </div>

          <dl className="rows mt-14 md:mt-20">
            {routes.map((r) => (
              <div key={r.from} className="grid gap-x-8 gap-y-1 py-6 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] md:py-7">
                <dt className="font-[family-name:var(--font-mincho)] text-[1.0625rem] tracking-[0.06em] text-ink">{r.from}から</dt>
                <dd>
                  約<span className="num">{r.km}</span>km。{r.car}
                  {r.walk ? `、${r.walk}` : ""}です。
                </dd>
              </div>
            ))}
          </dl>
          <p className="t-note mt-4">道のりと時間は、地図から出した目安です。道の混み具合や天候で変わります。</p>
        </div>
      </section>

      {/* ---- よくある質問 ---- */}
      <section className="section no-cv" id="faq">
        <div className="wrap grid gap-y-10 md:grid-cols-12 md:gap-x-8">
          <h2 className="t-h2 md:col-span-4">よくある質問</h2>
          <dl className="rows md:col-span-7 md:col-start-6">
            {faqs.map((f) => (
              <div key={f.q} className="py-6 md:py-7">
                <dt className="font-[family-name:var(--font-mincho)] text-[1.0625rem] leading-[1.8] tracking-[0.05em] text-ink">{f.q}</dt>
                <dd className="mt-2">{f.a}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <Onward
            links={[
              { href: pages.menu.path, label: "プレートランチとケーキのメニュー", note: `曜日プレート、ケーキ${cakes.length}種、テイクアウト。` },
              { href: pages.about.path, label: `${site.name}の店内と外観`, note: "水色の扉、木の柱、店名の読み方。" },
              { href: "/blog/category/mizusawa", label: "水沢・奥州のことを書いたブログ", note: "駅のこと、地名のこと。" },
            ]}
          />
        </div>
      </section>

      <JsonLd graph={pageGraph(page, [faqNode(page.path, faqs)], { detail: true })} />
    </>
  );
}
