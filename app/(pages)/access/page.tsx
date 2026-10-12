/**
 * アクセス。
 *
 * 担当する検索語 … 「水沢 カフェ 駐車場」（あわせて「水沢駅 カフェ」「Cafe Re faire 営業時間」「Cafe Re faire 場所」）
 * 役割          … 行き方・営業時間・駐車場・支払い・予約。来店の前に知りたいことに答える
 * 書かないこと   … メニューの説明（/menu）。道順の細かい案内（曲がり角・所要時間の断定）は、確かめられた範囲だけ
 *
 * よくある質問（FAQPage の構造化データ）は、サイト内でこのページだけに置く。
 *
 * 組み方：文字が主役。営業時間を大きな数字で見せ、店舗情報は表で、地図は幅いっぱいに大きく置く。
 */
import type { Metadata } from "next";
import { Hours } from "@/components/sections/Hours";
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

/** 区画の小さな番号（01 Information のような） */
function Index({ n, children }: { n: string; children: string }) {
  return (
    <p className="t-label" data-reveal="wipe">
      <span className="inline-block">
        <span className="n">{n}</span>
        {children}
      </span>
    </p>
  );
}

export default function AccessPage() {
  const faqs = buildFaqs();
  const { routes, road } = site.access;
  const { landmark } = site;

  return (
    <>
      <PageHead
        crumbs={crumbsFor(page)}
        label="Access"
        title={["アクセスと、", "営業時間"]}
        lead={
          <>
            {site.name}は、{addressLine}。{road}にあります。{parkingLine}の駐車場があり、{site.address.area}駅からは{routes[0].car}です。
          </>
        }
      />

      {/* ---- 営業時間・店舗情報・地図 ---- */}
      <section className="section" id="information">
        <div className="wrap">
          <Index n="01">Information</Index>
          <h2 className="sr-only">店舗情報</h2>
          <div className="mt-6 grid gap-y-14 lg:grid-cols-12 lg:gap-x-8">
            <div className="lg:col-span-6">
              <Hours />
            </div>
            <div className="lg:col-span-5 lg:col-start-8">
              <Photo photo={photos.parkingSign} ratio="4/3" sizes="(max-width: 1023px) 88vw, 38vw" parallax={30} priority />
              <p className="caption">外壁の水色の看板が目印。駐車場は、矢印の方向です。</p>
            </div>
          </div>

          <div className="mt-14 lg:mt-24 lg:grid lg:grid-cols-12 lg:gap-x-8">
            <div className="lg:col-span-8 lg:col-start-3">
              <ShopFacts />
            </div>
          </div>
        </div>

        {site.map.embedUrl && (
          <div className="mt-16 md:mt-28">
            <h2 className="sr-only">地図</h2>
            <MapEmbed embedUrl={site.map.embedUrl} title={`${site.name}の地図`} />
            <p className="wrap mt-4">
              <a href={site.map.linkUrl} target="_blank" rel="noopener noreferrer" className="more">
                Googleマップで開く
                <span className="sr-only">（別のタブで開きます）</span>
              </a>
            </p>
          </div>
        )}
      </section>

      {/* ---- 今月の営業日 ---- */}
      <section className="section" id="calendar">
        <div className="wrap">
          <Index n="02">Calendar</Index>
          <div className="mt-5 grid gap-y-10 md:grid-cols-12 md:gap-x-8">
            <div className="md:col-span-4">
              <h2 className="t-h2">営業日</h2>
              <p className="measure mt-8">定休日は{site.hours.closedDay}。ほかに、出店などで休む日があります。</p>
            </div>
            <div className="md:col-span-7 md:col-start-6">
              <MonthCalendar />
            </div>
          </div>
        </div>
      </section>

      {/* ---- 行き方 ---- */}
      <section className="section" id="route">
        <div className="wrap">
          <Index n="03">Route</Index>
          <div className="mt-5 grid gap-y-10 md:grid-cols-12 md:items-end md:gap-x-8">
            <div className="md:col-span-5 md:pb-6">
              <h2 className="t-h2">行き方</h2>
              <div className="measure mt-8 space-y-6">
                <p>
                  {road}。{landmark}の近くです。グレーと黒の外壁に掛かる、水色の看板を目印にしてください。
                </p>
                <p>駐車場は{parkingLine}。看板の矢印の先です。</p>
              </div>
            </div>
            <div className="md:col-span-7 md:col-start-6">
              <Photo photo={photos.exterior} ratio="4/3" className="pull-r" reveal="right" parallax={40} sizes="(max-width: 767px) 94vw, 58vw" />
            </div>
          </div>

          <dl className="rows mt-14 md:mt-24" data-reveal="rows">
            {routes.map((r) => (
              <div key={r.from} className="grid gap-x-8 gap-y-1 py-7 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] md:items-baseline md:py-9">
                <dt className="font-[family-name:var(--font-mincho)] text-[1.125rem] tracking-[0.06em] text-ink md:text-[1.375rem]">{r.from}から</dt>
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
      <section className="section" id="faq">
        <div className="wrap">
          <Index n="04">Q &amp; A</Index>
          <div className="mt-5 grid gap-y-10 md:grid-cols-12 md:gap-x-8">
            <h2 className="t-h2 md:col-span-4">よくある質問</h2>
            <dl className="rows md:col-span-7 md:col-start-6" data-reveal="rows">
              {faqs.map((f) => (
                <div key={f.q} className="py-7 md:py-8">
                  <dt className="font-[family-name:var(--font-mincho)] text-[1.0625rem] leading-[1.8] tracking-[0.05em] text-ink md:text-[1.1875rem]">{f.q}</dt>
                  <dd className="mt-2">{f.a}</dd>
                </div>
              ))}
            </dl>
          </div>
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
