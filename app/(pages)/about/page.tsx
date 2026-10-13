/**
 * 店のこと。
 *
 * 担当する検索語 … 「Cafe Re faire」「カフェ ルフェール」（店名で調べた人）、「水沢 新しいカフェ」
 * 役割          … どこの・いつからの・どんな店か。店の外と中を、写真で見せる
 * 書かないこと   … 店主の考えや来歴（確かめられていない。届いたら「店のはじまり」として足す）。
 *                  メニューの細かい説明は /menu、行き方は /access に任せる
 *
 * 組み方：写真を大きく、見出しを大きく、文章は短く。余白を広く取る。
 */
import type { Metadata } from "next";
import Link from "next/link";
import { Onward } from "@/components/sections/Onward";
import { PageHead } from "@/components/sections/PageHead";
import { JsonLd } from "@/components/ui/JsonLd";
import { Lines } from "@/components/ui/Lines";
import { Photo } from "@/components/ui/Photo";
import { Wordmark } from "@/components/ui/Wordmark";
import { cakePrice, cakes } from "@/data/menu";
import { pages } from "@/data/pages";
import { photos } from "@/data/photos";
import { addressLine, closedLine, jaDate, parkingLine, paymentLine, site, sundayHours, weekdayHours } from "@/data/site";
import { crumbsFor, pageGraph } from "@/lib/schema";
import { pageMetadata } from "@/lib/seo";

const page = pages.about;

export const metadata: Metadata = pageMetadata(page);

/** 区画の小さな番号（01 Outside のような） */
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

export default function AboutPage() {
  return (
    <>
      <PageHead
        crumbs={crumbsFor(page)}
        label="About"
        title={
          <>
            {/* 店名は、看板と同じ組み方（欧文の書体）で */}
            <span className="latin text-[1.16em] tracking-[-0.01em]">
              <Wordmark />
            </span>
            について
          </>
        }
        lead={
          <>
            {site.name}（{site.reading}）は、{site.address.region}
            {site.address.locality}
            {site.address.district}にあるカフェです。{jaDate(site.openedOn)}にオープンしました。
          </>
        }
      />

      {/* ---- 外から ---- */}
      <section className="section">
        <div className="wrap">
          <Photo
            photo={photos.exterior}
            ratio="16/9"
            ratioSp="4/3"
            className="pull-l md:mr-[8%]"
            sizes="(max-width: 767px) 94vw, 88vw"
            quality={85}
            parallax={48}
            priority
          />

          <div className="mt-14 grid gap-y-12 md:mt-24 md:grid-cols-12 md:gap-x-8">
            <div className="md:col-span-5">
              <Index n="01">Outside</Index>
              <h2 className="t-h2 mt-5" data-reveal="lines">
                <Lines lines={["目印は、", "水色の扉と看板。"]} />
              </h2>
              <div className="measure mt-8 space-y-6 md:mt-10">
                <p>
                  {site.access.road}。グレーと黒の外壁に、水色の看板が掛かっています。看板の矢印の先が、駐車場です。
                </p>
                <p>入口は、アイアンの飾りがついた水色の扉。わきに、オリーブの鉢を置いています。</p>
              </div>
            </div>

            <div className="grid grid-cols-12 items-start gap-x-4 md:col-span-6 md:col-start-7 md:gap-x-8">
              <div className="col-span-7">
                <Photo photo={photos.entranceSign} ratio="3/4" position="50% 30%" parallax={24} sizes="(max-width: 767px) 54vw, 28vw" contained />
              </div>
              <div className="col-span-5 mt-20 md:mt-36">
                <Photo photo={photos.oliveTree} ratio="3/4" reveal="right" delay={0.12} parallax={44} sizes="(max-width: 767px) 38vw, 20vw" contained />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---- 店名 ---- */}
      <section className="section">
        <div className="wrap grid gap-y-10 md:grid-cols-12 md:items-center md:gap-x-8">
          <div className="md:col-span-6">
            <Photo photo={photos.signboard} ratio="4/5" position="60% 45%" className="pull-l" reveal="left" parallax={40} sizes="(max-width: 767px) 94vw, 48vw" />
          </div>
          <div className="md:col-span-5 md:col-start-8">
            <Index n="02">Name</Index>
            <h2 className="t-h2 mt-5" data-reveal="lines">
              <Lines lines={["店名は、", "「ルフェール」と読みます。"]} />
            </h2>
            <div className="measure mt-8 space-y-6 md:mt-10">
              <p>
                看板には、コーヒーカップの絵と「{site.name}」の文字。その下に、小さく「{site.reading}」と書いてあります。
              </p>
              <p>
                refaire（ルフェール）は、フランス語で「もう一度つくる」「やり直す」という意味のことばです。
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ---- 店内 ---- */}
      <section className="section">
        <div className="wrap">
          <div className="grid gap-y-10 md:grid-cols-12 md:gap-x-8">
            <div className="md:col-span-5">
              <Index n="03">Inside</Index>
              <h2 className="t-h2 mt-5" data-reveal="lines">
                <Lines lines={["木の柱が4本立つ、", "明るい店内。"]} />
              </h2>
              <div className="measure mt-8 space-y-6 md:mt-10">
                <p>客席のあいだに、木の柱が4本。足もとには観葉植物。壁はグレー、床は石の色で、窓から光が入ります。</p>
                <p>席は、2人掛けと4人掛けのテーブル。壁の上のほうには、古材風の板を張っています。</p>
                <p>白いカウンターの前には、小さな鉢植え。壁には、コーヒーカップを一筆書きのように描いた線画を飾っています。</p>
              </div>
            </div>
            <div className="md:col-span-6 md:col-start-7">
              <Photo photo={photos.interior02} ratio="4/5" position="50% 60%" className="pull-r" reveal="right" parallax={44} sizes="(max-width: 767px) 94vw, 48vw" />
            </div>
          </div>

          <div className="mt-6 grid grid-cols-12 items-start gap-x-4 md:mt-10 md:gap-x-8">
            <div className="col-span-5 md:col-span-3 md:col-start-2">
              <Photo photo={photos.wallArt} ratio="3/4" position="40% 30%" parallax={18} sizes="(max-width: 767px) 38vw, 22vw" contained />
            </div>
            <div className="col-span-7 mt-16 md:col-span-7 md:col-start-6 md:mt-32">
              <Photo photo={photos.interior01} ratio="3/2" reveal="left" delay={0.12} parallax={36} sizes="(max-width: 767px) 54vw, 52vw" contained />
            </div>
          </div>
        </div>
      </section>

      {/* ---- 過ごし方 ---- */}
      <section className="section">
        <div className="wrap grid gap-y-10 md:grid-cols-12 md:gap-x-8">
          <div className="md:col-span-5">
            <Index n="04">How to</Index>
            <h2 className="t-h2 mt-5">店での過ごし方</h2>
            <p className="measure mt-8 md:mt-10">
              昼は、曜日ごとに内容の替わるプレート。ショーケースには、ケーキが{cakes.length}種類（各{cakePrice}
              円）。店のInstagramには「{site.words.welcome.text}」とあります。食事をしない日も、気がねなくどうぞ。
            </p>
            <p className="mt-8">
              <Link href={pages.menu.path} className="more">
                プレートとケーキのメニュー
              </Link>
            </p>
          </div>

          <dl className="rows term-rows md:col-span-6 md:col-start-7" data-reveal="rows">
            {[
              { term: "注文", body: `${site.ordering}します。` },
              { term: "予約", body: `${site.reservation.by}で受け付けています。` },
              { term: "支払い", body: `${paymentLine}が使えます。` },
              { term: "持ち帰り", body: `弁当のテイクアウトができます。${site.takeout.preorderBy.join("か")}で、先に注文できます。` },
            ].map((row) => (
              <div key={row.term}>
                <dt>{row.term}</dt>
                <dd>{row.body}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ---- 店の概要（事実だけを、短く） ---- */}
      <section className="section" id="profile">
        <div className="wrap grid gap-y-10 md:grid-cols-12 md:gap-x-8">
          <div className="md:col-span-4">
            <Index n="05">Profile</Index>
            <h2 className="t-h2 mt-5">店の概要</h2>
            <p className="measure mt-8">
              {site.name}は、{site.address.locality}
              {site.address.area}のカフェです。{site.access.routes[0].from}から{site.access.routes[0].car}、{parkingLine}の駐車場があります。
            </p>
          </div>
          <dl className="facts md:col-span-7 md:col-start-6" data-reveal="rows">
            <div>
              <dt>店名</dt>
              <dd>
                {site.name}（{site.reading}）
              </dd>
            </div>
            <div>
              <dt>業種</dt>
              <dd>{site.kind}</dd>
            </div>
            <div>
              <dt>オープン</dt>
              <dd>
                <time dateTime={site.openedOn}>{jaDate(site.openedOn)}</time>
              </dd>
            </div>
            <div>
              <dt>所在地</dt>
              <dd>{addressLine}</dd>
            </div>
            <div>
              <dt>営業時間</dt>
              <dd>
                {weekdayHours}／日曜・祝日 {sundayHours}
              </dd>
            </div>
            <div>
              <dt>定休日</dt>
              <dd>{closedLine}</dd>
            </div>
            <div>
              <dt>メニュー</dt>
              <dd>曜日プレート、ケーキ、飲みもの、テイクアウトの弁当</dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <Onward
            links={[
              { href: pages.menu.path, label: "プレートランチとケーキのメニュー", note: `曜日プレート、ケーキ${cakes.length}種、テイクアウト。` },
              { href: pages.access.path, label: "アクセスと営業時間", note: "地図、駐車場、水沢駅からの行き方、今月の営業日。" },
              { href: pages.blog.path, label: "ブログ", note: "店のこと、水沢のこと、店からのお知らせ。" },
            ]}
          />
        </div>
      </section>

      <JsonLd graph={pageGraph(page, [], { type: "AboutPage" })} />
    </>
  );
}
