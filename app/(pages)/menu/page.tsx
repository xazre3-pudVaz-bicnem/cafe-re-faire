/**
 * メニュー。
 *
 * 担当する検索語 … 「水沢 ランチ カフェ」（あわせて「水沢 ケーキ」「水沢 スイーツ」「水沢 テイクアウト」）
 * 役割          … 何が食べられるか・いくらか
 * 書かないこと   … 確かめられていない品名・価格（ドリンクの品名、プレートの価格と曜日ごとの内容）。
 *                  行き方・営業時間は /access に任せる
 */
import type { Metadata } from "next";
import { Onward } from "@/components/sections/Onward";
import { PageHead } from "@/components/sections/PageHead";
import { JsonLd } from "@/components/ui/JsonLd";
import { Photo } from "@/components/ui/Photo";
import { cakePrice, cakePriceAsOf, cakes, plates, shopFavorites, type Cake, type Plate } from "@/data/menu";
import { pages } from "@/data/pages";
import { photos } from "@/data/photos";
import { paymentLine, site, takeoutPriceText, telHref } from "@/data/site";
import { crumbsFor, menuNode, pageGraph } from "@/lib/schema";
import { pageMetadata } from "@/lib/seo";

const page = pages.menu;

export const metadata: Metadata = pageMetadata(page);

function Price({ yen }: { yen: number }) {
  return (
    <span className="whitespace-nowrap">
      <span className="num">{yen}</span>円
    </span>
  );
}

function PlateFigure({ plate, sizes, ratio = "3/2", className, photoClassName, delay }: { plate: Plate; sizes: string; ratio?: string; className?: string; photoClassName?: string; delay?: number }) {
  return (
    <figure className={className}>
      <Photo photo={photos[plate.photo]} ratio={ratio} sizes={sizes} className={photoClassName} delay={delay} />
      <figcaption className="mt-4">
        <h3 className="t-h3">{plate.label}</h3>
        <p className="mt-1 text-[0.875rem] leading-[1.9]">{plate.onPlate}</p>
      </figcaption>
    </figure>
  );
}

function CakeFigure({ cake, sizes, ratio = "4/5", className, delay }: { cake: Cake; sizes: string; ratio?: string; className?: string; delay?: number }) {
  return (
    <figure className={className} id={cake.id}>
      <Photo photo={photos[cake.photo]} ratio={ratio} sizes={sizes} delay={delay} />
      <figcaption className="mt-4">
        <h3 className="t-h3 flex flex-wrap items-baseline justify-between gap-x-4">
          <span>{cake.name}</span>
          <span className="font-[family-name:var(--font-gothic)] text-[0.875rem] font-normal tracking-[0.04em] text-ink-2">
            <Price yen={cake.price} />
          </span>
        </h3>
        <p className="mt-1 text-[0.875rem] leading-[1.9]">{cake.look}</p>
      </figcaption>
    </figure>
  );
}

export default function MenuPage() {
  const [roastBeef, tacoRice, omurice, hamburg, chicken] = ["roast-beef", "taco-rice", "omurice", "hamburg", "chicken"].map(
    (id) => plates.find((p) => p.id === id)!,
  );
  const cake = (id: string) => cakes.find((c) => c.id === id)!;

  return (
    <>
      <PageHead
        crumbs={crumbsFor(page)}
        title={
          <>
            <span className="ib">プレートランチと、</span>
            <span className="ib">ケーキのメニュー</span>
          </>
        }
        lead={
          <>
            {site.address.area}のカフェ {site.name}のメニューです。昼は、曜日ごとに内容の替わるプレート。ショーケースには、ケーキが{cakes.length}
            種類。テイクアウトの弁当もあります。
          </>
        }
      />

      {/* ---- 曜日プレート ---- */}
      <section className="section no-cv" id="plate">
        <div className="wrap">
          <div className="grid gap-y-6 md:grid-cols-12 md:gap-x-8">
            <h2 className="t-h2 md:col-span-4">曜日プレート</h2>
            <div className="measure space-y-5 md:col-span-7 md:col-start-6">
              <p>昼の食事は、曜日ごとに内容の替わるプレートです。ごはんとおかず、サラダを、ひと皿に盛り合わせます。</p>
              <p className="t-note">写真は、プレートの一例です。曜日ごとの内容と価格は、店頭か店のInstagramでご確認ください。</p>
            </div>
          </div>

          <div className="mt-12 grid gap-y-14 md:mt-20 md:grid-cols-12 md:gap-x-8 md:gap-y-24">
            <PlateFigure plate={roastBeef} sizes="(max-width: 767px) 94vw, 66vw" className="md:col-span-8" photoClassName="pull-l" />

            <PlateFigure
              plate={tacoRice}
              sizes="(max-width: 767px) 80vw, 42vw"
              className="ml-auto w-[86%] md:col-span-6 md:col-start-7 md:w-auto"
              delay={0.1}
            />

            <PlateFigure plate={omurice} sizes="(max-width: 767px) 80vw, 34vw" className="w-[86%] md:col-span-5 md:w-auto md:-mt-28 lg:-mt-40" />

            <PlateFigure
              plate={hamburg}
              sizes="(max-width: 767px) 94vw, 50vw"
              className="md:col-span-7 md:col-start-6"
              photoClassName="max-md:pull-r"
              delay={0.1}
            />

            <PlateFigure plate={chicken} sizes="(max-width: 767px) 80vw, 42vw" className="w-[86%] md:col-span-6 md:col-start-2 md:w-auto" />

            <figure className="ml-auto w-[62%] md:col-span-3 md:col-start-10 md:mt-24 md:w-auto">
              <Photo photo={photos.pizza} ratio="1/1" sizes="(max-width: 767px) 58vw, 22vw" delay={0.1} />
              <figcaption className="mt-4">
                <h3 className="t-h3">ピザ</h3>
                <p className="mt-1 text-[0.875rem] leading-[1.9]">トマトをのせて焼いた、丸いピザ。</p>
              </figcaption>
            </figure>
          </div>
        </div>
      </section>

      {/* ---- ケーキ ---- */}
      <section className="section no-cv" id="cake">
        <div className="wrap">
          <div className="grid gap-y-10 md:grid-cols-12 md:items-end md:gap-x-8">
            <div className="md:col-span-6">
              <h2 className="t-h2">ケーキ</h2>
              <div className="measure mt-6 space-y-5 md:mt-8">
                <p>
                  ショーケースに並ぶケーキは{cakes.length}種類。どれも{cakePrice}円です。皿に盛りつけ、クリームとソースを添えてお出しします。
                </p>
                <p>
                  店のInstagramで人気のメニューとして紹介されているのは、{shopFavorites[0]}と、{shopFavorites[1]}です。
                </p>
              </div>
              <ul className="rows mt-10">
                {cakes.map((c) => (
                  <li key={c.id} className="flex items-baseline justify-between gap-x-6 py-3.5">
                    <a href={`#${c.id}`} className="text-ink underline decoration-transparent decoration-1 underline-offset-[0.4em] transition-colors hover:decoration-door">
                      {c.name}
                    </a>
                    <Price yen={c.price} />
                  </li>
                ))}
              </ul>
              <p className="t-note mt-4">価格は{cakePriceAsOf}時点の店頭の表示です。</p>
            </div>

            <figure className="md:col-span-5 md:col-start-8">
              <Photo photo={photos.showcase01} ratio="1/1" sizes="(max-width: 767px) 88vw, 38vw" />
              <figcaption className="caption">ケーキのショーケース。値札は手書きです。</figcaption>
            </figure>
          </div>

          <div className="mt-16 grid gap-y-14 md:mt-28 md:grid-cols-12 md:gap-x-8 md:gap-y-24">
            <CakeFigure cake={cake("sweet-potato-cheesecake")} sizes="(max-width: 767px) 88vw, 46vw" className="md:col-span-6" />
            <CakeFigure
              cake={cake("chocolat-berry-parfait")}
              sizes="(max-width: 767px) 66vw, 30vw"
              className="ml-auto w-[72%] md:col-span-4 md:col-start-8 md:mt-40 md:w-auto"
              delay={0.1}
            />

            <CakeFigure cake={cake("caramel-cheese-terrine")} sizes="(max-width: 767px) 66vw, 30vw" className="w-[72%] md:col-span-4 md:col-start-2 md:w-auto" ratio="1/1" />
            <CakeFigure
              cake={cake("matcha-terrine")}
              sizes="(max-width: 767px) 88vw, 46vw"
              ratio="4/3"
              className="md:col-span-6 md:col-start-7 md:mt-24"
              delay={0.1}
            />

            <CakeFigure cake={cake("tiramisu-mousse")} sizes="(max-width: 767px) 66vw, 38vw" className="ml-auto w-[72%] md:col-span-5 md:ml-0 md:w-auto" />
            <CakeFigure
              cake={cake("crumble-berry-gateau-chocolat")}
              sizes="(max-width: 767px) 88vw, 38vw"
              className="md:col-span-5 md:col-start-8 md:mt-32"
              delay={0.1}
            />
          </div>
        </div>
      </section>

      {/* ---- 飲みもの・注文 ---- */}
      <section className="section">
        <div className="wrap grid gap-y-10 md:grid-cols-12 md:gap-x-8">
          <h2 className="t-h2 md:col-span-5">
            <span className="ib">飲みものと、</span>
            <span className="ib">注文のしかた</span>
          </h2>
          <dl className="rows md:col-span-6 md:col-start-7">
            <div className="grid grid-cols-[5.5em_minmax(0,1fr)] gap-x-5 py-6 md:grid-cols-[7.5em_minmax(0,1fr)]">
              <dt className="font-[family-name:var(--font-mincho)] text-[1.0625rem] tracking-[0.1em] text-ink">飲みもの</dt>
              <dd>飲みものだけの利用もできます。内容は、店頭でご確認ください。</dd>
            </div>
            <div className="grid grid-cols-[5.5em_minmax(0,1fr)] gap-x-5 py-6 md:grid-cols-[7.5em_minmax(0,1fr)]">
              <dt className="font-[family-name:var(--font-mincho)] text-[1.0625rem] tracking-[0.1em] text-ink">注文</dt>
              <dd>{site.ordering}します。</dd>
            </div>
            <div className="grid grid-cols-[5.5em_minmax(0,1fr)] gap-x-5 py-6 md:grid-cols-[7.5em_minmax(0,1fr)]">
              <dt className="font-[family-name:var(--font-mincho)] text-[1.0625rem] tracking-[0.1em] text-ink">支払い</dt>
              <dd>{paymentLine}が使えます。</dd>
            </div>
          </dl>
        </div>
      </section>

      {/* ---- テイクアウト ---- */}
      <section className="section no-cv" id="takeout">
        <div className="wrap grid gap-y-10 md:grid-cols-12 md:items-center md:gap-x-8">
          <figure className="md:col-span-7">
            <Photo photo={photos.takeout01} ratio="4/3" className="pull-l" sizes="(max-width: 767px) 94vw, 58vw" />
            <figcaption className="caption">テイクアウトの弁当。写真は、{site.takeout.seenInPhoto.join("、")}。</figcaption>
          </figure>
          <div className="md:col-span-4 md:col-start-9">
            <h2 className="t-h2">テイクアウト</h2>
            <div className="mt-6 space-y-5 md:mt-8">
              <p>弁当は{site.takeout.kinds}種類。{takeoutPriceText()}です。</p>
              <p>
                {site.takeout.preorderBy.join("か")}で先に注文しておくと、受け取りがスムーズです。
                {site.phone && telHref && (
                  <>
                    電話は{" "}
                    <a href={telHref} className="link whitespace-nowrap">
                      {site.phone.display}
                    </a>
                    。
                  </>
                )}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <Onward
            links={[
              { href: pages.access.path, label: "営業時間と駐車場、行き方", note: "朝9時から。店舗前に駐車場があります。" },
              { href: pages.about.path, label: `${site.name}の店内と外観`, note: "水色の扉、木の柱、ケーキのショーケース。" },
              { href: "/blog/category/menu", label: "メニューにまつわるブログ", note: "料理やお菓子の名前の由来、選び方。" },
            ]}
          />
        </div>
      </section>

      <JsonLd graph={pageGraph(page, [menuNode()])} />
    </>
  );
}
