/**
 * メニュー。
 *
 * 担当する検索語 … 「水沢 ランチ カフェ」（あわせて「水沢 ケーキ」「水沢 スイーツ」「水沢 テイクアウト」）
 * 役割          … 何が食べられるか・いくらか
 * 書かないこと   … 確かめられていない品名・価格（ドリンクの品名、プレートの価格と曜日ごとの内容）。
 *                  行き方・営業時間は /access に任せる
 *
 * 組み方：価格表を並べるだけにしない。料理の写真を大きく、名前と価格は小さく、読める位置に添える。
 */
import type { Metadata } from "next";
import { Onward } from "@/components/sections/Onward";
import { PageHead } from "@/components/sections/PageHead";
import { JsonLd } from "@/components/ui/JsonLd";
import { Lines } from "@/components/ui/Lines";
import { Photo } from "@/components/ui/Photo";
import { cakePrice, cakePriceAsOf, cakes, plates, shopFavorites, type Cake, type Plate } from "@/data/menu";
import { pages } from "@/data/pages";
import { photos } from "@/data/photos";
import { paymentLine, site, takeoutPriceText, telHref } from "@/data/site";
import { crumbsFor, menuNode, pageGraph } from "@/lib/schema";
import { pageMetadata } from "@/lib/seo";

const page = pages.menu;

export const metadata: Metadata = pageMetadata(page);

type Reveal = "up" | "left" | "right";

function Price({ yen }: { yen: number }) {
  return (
    <span className="whitespace-nowrap">
      <span className="num">{yen}</span>円
    </span>
  );
}

/** 区画の小さな番号（01 Plate のような） */
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

function PlateFigure({
  plate,
  sizes,
  ratio = "3/2",
  className,
  photoClassName,
  reveal,
  parallax,
}: {
  plate: Plate;
  sizes: string;
  ratio?: string;
  className?: string;
  photoClassName?: string;
  reveal?: Reveal;
  parallax?: number;
}) {
  return (
    <figure className={`zoom ${className ?? ""}`}>
      <Photo photo={photos[plate.photo]} ratio={ratio} sizes={sizes} className={photoClassName} reveal={reveal} parallax={parallax} />
      <figcaption className="mt-4">
        <h3 className="t-h3">{plate.label}</h3>
        <p className="mt-1 text-[0.875rem] leading-[1.9]">{plate.onPlate}</p>
      </figcaption>
    </figure>
  );
}

function CakeFigure({
  cake,
  sizes,
  ratio = "4/5",
  className,
  reveal,
  parallax,
}: {
  cake: Cake;
  sizes: string;
  ratio?: string;
  className?: string;
  reveal?: Reveal;
  parallax?: number;
}) {
  return (
    <figure className={`zoom ${className ?? ""}`} id={cake.id}>
      <Photo photo={photos[cake.photo]} ratio={ratio} sizes={sizes} reveal={reveal} parallax={parallax} />
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
        label="Menu"
        title={["プレートランチと、", "ケーキのメニュー"]}
        lead={
          <>
            {site.address.area}のカフェ {site.name}のメニューです。昼は、曜日ごとに内容の替わるプレート。ショーケースには、ケーキが{cakes.length}
            種類。テイクアウトの弁当もあります。
          </>
        }
      />

      {/* ---- 曜日プレート ---- */}
      <section className="section" id="plate">
        <div className="wrap">
          <Index n="01">Plate</Index>
          <div className="mt-5 grid gap-y-6 md:grid-cols-12 md:gap-x-8">
            <h2 className="t-h2 md:col-span-4">曜日プレート</h2>
            <div className="measure space-y-5 md:col-span-7 md:col-start-6">
              <p>昼の食事は、曜日ごとに内容の替わるプレートです。ごはんとおかず、サラダを、ひと皿に盛り合わせます。</p>
              <p className="t-note">写真は、プレートの一例です。曜日ごとの内容と価格は、店頭か店のInstagramでご確認ください。</p>
            </div>
          </div>

          <div className="mt-12 grid gap-y-14 md:mt-20 md:grid-cols-12 md:gap-x-8 md:gap-y-28">
            <PlateFigure
              plate={roastBeef}
              sizes="(max-width: 767px) 94vw, 72vw"
              className="md:col-span-9"
              photoClassName="pull-l"
              parallax={44}
            />

            <PlateFigure
              plate={tacoRice}
              sizes="(max-width: 767px) 82vw, 44vw"
              className="ml-auto w-[88%] md:col-span-6 md:col-start-7 md:w-auto"
              reveal="right"
              parallax={30}
            />

            <PlateFigure
              plate={omurice}
              sizes="(max-width: 767px) 80vw, 34vw"
              ratio="4/3"
              className="w-[86%] md:col-span-5 md:w-auto md:-mt-40 lg:-mt-56"
              reveal="left"
              parallax={22}
            />

            <PlateFigure
              plate={hamburg}
              sizes="(max-width: 767px) 94vw, 58vw"
              className="md:col-span-7 md:col-start-6"
              photoClassName="pull-r"
              reveal="right"
              parallax={40}
            />

            <PlateFigure plate={chicken} sizes="(max-width: 767px) 80vw, 42vw" className="w-[86%] md:col-span-6 md:col-start-2 md:w-auto" parallax={28} />

            <figure className="zoom ml-auto w-[62%] md:col-span-3 md:col-start-10 md:mt-28 md:w-auto">
              <Photo photo={photos.pizza} ratio="1/1" sizes="(max-width: 767px) 58vw, 22vw" reveal="left" parallax={16} />
              <figcaption className="mt-4">
                <h3 className="t-h3">ピザ</h3>
                <p className="mt-1 text-[0.875rem] leading-[1.9]">トマトをのせて焼いた、丸いピザ。</p>
              </figcaption>
            </figure>
          </div>
        </div>
      </section>

      {/* ---- ケーキ ---- */}
      <section className="section" id="cake">
        <div className="wrap">
          <Index n="02">Cake</Index>
          <div className="mt-5 grid gap-y-10 md:grid-cols-12 md:items-end md:gap-x-8">
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
              <ul className="rows mt-10" data-reveal="rows">
                {cakes.map((c) => (
                  <li key={c.id} className="flex items-baseline justify-between gap-x-6 py-4">
                    <a href={`#${c.id}`} className="font-[family-name:var(--font-mincho)] text-[1.0625rem] tracking-[0.05em] text-ink">
                      <span className="ul">{c.name}</span>
                    </a>
                    <Price yen={c.price} />
                  </li>
                ))}
              </ul>
              <p className="t-note mt-4">価格は{cakePriceAsOf}時点の店頭の表示です。</p>
            </div>

            <figure className="md:col-span-5 md:col-start-8">
              <Photo photo={photos.showcase01} ratio="1/1" sizes="(max-width: 767px) 88vw, 38vw" reveal="right" parallax={30} />
              <figcaption className="caption">ケーキのショーケース。値札は手書きです。</figcaption>
            </figure>
          </div>

          <div className="mt-16 grid gap-y-14 md:mt-32 md:grid-cols-12 md:gap-x-8 md:gap-y-28">
            <CakeFigure cake={cake("sweet-potato-cheesecake")} sizes="(max-width: 767px) 88vw, 50vw" className="md:col-span-7" parallax={40} />
            <CakeFigure
              cake={cake("chocolat-berry-parfait")}
              sizes="(max-width: 767px) 66vw, 30vw"
              className="ml-auto w-[72%] md:col-span-4 md:col-start-9 md:mt-56 md:w-auto"
              reveal="right"
              parallax={20}
            />

            <CakeFigure
              cake={cake("caramel-cheese-terrine")}
              sizes="(max-width: 767px) 66vw, 30vw"
              className="w-[72%] md:col-span-4 md:col-start-2 md:w-auto"
              ratio="1/1"
              reveal="left"
              parallax={18}
            />
            <CakeFigure
              cake={cake("matcha-terrine")}
              sizes="(max-width: 767px) 94vw, 52vw"
              ratio="4/3"
              className="md:col-span-6 md:col-start-7 md:mt-28"
              parallax={36}
            />

            <CakeFigure
              cake={cake("tiramisu-mousse")}
              sizes="(max-width: 767px) 66vw, 38vw"
              className="ml-auto w-[72%] md:col-span-5 md:ml-0 md:w-auto"
              reveal="left"
              parallax={26}
            />
            <CakeFigure
              cake={cake("crumble-berry-gateau-chocolat")}
              sizes="(max-width: 767px) 88vw, 38vw"
              className="md:col-span-5 md:col-start-8 md:mt-40"
              reveal="right"
              parallax={32}
            />
          </div>
        </div>
      </section>

      {/* ---- 飲みもの・注文 ---- */}
      <section className="section">
        <div className="wrap">
          <Index n="03">Drink / Order</Index>
          <div className="mt-5 grid gap-y-10 md:grid-cols-12 md:gap-x-8">
            <h2 className="t-h2 md:col-span-5" data-reveal="lines">
              <Lines lines={["飲みものと、", "注文のしかた"]} />
            </h2>
            <dl className="rows term-rows md:col-span-6 md:col-start-7" data-reveal="rows">
              <div>
                <dt>飲みもの</dt>
                <dd>飲みものだけの利用もできます。内容は、店頭でご確認ください。</dd>
              </div>
              <div>
                <dt>注文</dt>
                <dd>{site.ordering}します。</dd>
              </div>
              <div>
                <dt>支払い</dt>
                <dd>{paymentLine}が使えます。</dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      {/* ---- テイクアウト ---- */}
      <section className="section" id="takeout">
        <div className="wrap">
          <Index n="04">Take out</Index>
          <div className="mt-5 grid gap-y-10 md:grid-cols-12 md:items-end md:gap-x-8">
            <figure className="md:col-span-8">
              <Photo photo={photos.takeout01} ratio="3/2" ratioSp="4/3" className="pull-l" parallax={40} sizes="(max-width: 767px) 94vw, 64vw" />
              <figcaption className="caption">テイクアウトの弁当。写真は、{site.takeout.seenInPhoto.join("、")}。</figcaption>
            </figure>
            <div className="md:col-span-4 md:col-start-9 md:pb-10">
              <h2 className="t-h2">テイクアウト</h2>
              <div className="mt-6 space-y-5 md:mt-8">
                <p>
                  弁当は{site.takeout.kinds}種類。{takeoutPriceText()}です。
                </p>
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
