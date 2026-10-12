import type { CSSProperties } from "react";
import { Lines } from "@/components/ui/Lines";
import { Photo } from "@/components/ui/Photo";
import { cakePrice, cakes } from "@/data/menu";
import { photos } from "@/data/photos";
import { jaDate, jaTime, site } from "@/data/site";

/**
 * 03 店の使いかた。
 * 店の考えを、こちらで作って書かない。書くのは、店が Instagram に書いていることば（引用）と、
 * 営業時間・メニューから分かる事実だけ。店主のことばが届いたら、ここを差し替える（docs/TODO.md）。
 *
 * 組み方：PC では、左の「食事でも、ケーキだけでも。」が貼りついたまま、右を 朝 → 昼 → 甘いもの → 持ち帰り の場面が流れる。
 * 場面ごとに、写真の大きさ・寄せる側・文章との位置を変えている（同じ箱を4つ並べない）。
 */
export function Concept() {
  const { weekday, sundayHoliday } = site.hours;
  const { welcome } = site.words;

  return (
    <section className="section">
      <div className="wide grid gap-y-16 lg:grid-cols-12 lg:gap-x-8">
        <div className="msg-side lg:col-span-5">
          <h2 className="msg-title" data-reveal="lines">
            <Lines lines={["食事でも、", "ケーキだけでも。"]} />
          </h2>
          <figure className="msg-quote measure mt-9 md:mt-12" data-reveal="fade" style={{ "--d": "0.35s" } as CSSProperties}>
            <blockquote cite={welcome.source}>
              <p>{welcome.text}</p>
            </blockquote>
            <figcaption className="t-note mt-3 pl-5">
              {site.name}のInstagramより（{jaDate(welcome.date)}の投稿）
            </figcaption>
          </figure>
          <p className="measure mt-8">昼をしっかり食べる日も、甘いものと飲みものだけの日も。使いかたは、その日の気分で決めてください。</p>
        </div>

        <dl className="space-y-20 md:space-y-28 lg:col-span-6 lg:col-start-7 lg:space-y-40">
          {/* 朝：文章を左下に、縦長の写真を右に */}
          <div>
            <dt className="scene-term">朝</dt>
            <dd className="mt-3 md:grid md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] md:items-end md:gap-x-8">
              <p>
                {jaTime(weekday.opens)}に開きます。営業は{jaTime(weekday.closes)}まで、日曜と祝日は{jaTime(sundayHoliday.closes)}まで。
              </p>
              <div className="mt-7 max-md:ml-auto max-md:w-[74%] md:mt-0">
                <Photo photo={photos.oliveTree} ratio="3/4" parallax={28} sizes="(max-width: 767px) 70vw, (max-width: 1023px) 52vw, 28vw" />
              </div>
            </dd>
          </div>

          {/* 昼：横長の写真を、右の端まで */}
          <div>
            <dt className="scene-term">昼</dt>
            <dd className="mt-3">
              <p>曜日ごとに内容の替わる、曜日プレート。</p>
              <div className="mt-7">
                <Photo photo={photos.plateOmurice} ratio="3/2" className="pull-r" reveal="left" parallax={40} sizes="(max-width: 1023px) 94vw, 54vw" />
              </div>
            </dd>
          </div>

          {/* 甘いもの：写真を左に、文章を右下に */}
          <div>
            <dt className="scene-term">甘いもの</dt>
            <dd className="mt-3 md:grid md:grid-cols-[minmax(0,7fr)_minmax(0,4fr)] md:items-end md:gap-x-8">
              <p className="md:order-2">
                ショーケースに、ケーキが{cakes.length}種類。各{cakePrice}円。
              </p>
              <div className="mt-7 max-md:w-[84%] md:order-1 md:mt-0">
                <Photo photo={photos.showcase01} ratio="1/1" parallax={24} sizes="(max-width: 767px) 80vw, (max-width: 1023px) 56vw, 30vw" />
              </div>
            </dd>
          </div>

          {/* 持ち帰り：少し小さく、右へ寄せる */}
          <div>
            <dt className="scene-term">持ち帰り</dt>
            <dd className="mt-3">
              <p>弁当は{site.takeout.kinds}種類。先に注文しておくと、受け取りがスムーズです。</p>
              <div className="mt-7 ml-auto w-[90%] md:w-[82%]">
                <Photo photo={photos.takeout01} ratio="4/3" reveal="right" parallax={34} sizes="(max-width: 1023px) 86vw, 44vw" />
              </div>
            </dd>
          </div>
        </dl>
      </div>
    </section>
  );
}
