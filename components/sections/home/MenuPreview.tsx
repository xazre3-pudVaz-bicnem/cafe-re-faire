import Link from "next/link";
import { Photo } from "@/components/ui/Photo";
import { cakePrice, cakes } from "@/data/menu";
import { pages } from "@/data/pages";
import { photos } from "@/data/photos";

/**
 * 04 メニュー。写真を大きく、余白を広く。
 * 品物を同じ大きさの箱に並べない。載せるのは、確かめられた名前と価格だけ。
 */
export function MenuPreview() {
  const sweetPotato = cakes.find((c) => c.id === "sweet-potato-cheesecake")!;
  const tiramisu = cakes.find((c) => c.id === "tiramisu-mousse")!;

  return (
    <section className="section">
      <div className="wrap">
        <h2 className="t-h2">
          <span className="ib">曜日プレートと、</span>
          <span className="ib">{cakes.length}種のケーキ</span>
        </h2>
        <p className="measure mt-8 md:mt-10">
          昼は、曜日ごとに内容の替わるプレート。ショーケースには、ケーキが{cakes.length}種類並びます。
        </p>

        {/* 1段目：プレート（大。左は区画の端まで）と、ケーキ（縦） */}
        <div className="mt-14 grid gap-y-14 md:mt-20 md:grid-cols-12 md:items-start md:gap-x-8">
          <figure className="md:col-span-8">
            <Photo photo={photos.plateRoastBeef} ratio="3/2" className="pull-l" sizes="(max-width: 767px) 94vw, 66vw" />
            <figcaption className="caption">曜日プレート。写真はローストビーフ。</figcaption>
          </figure>

          <figure className="ml-auto w-[68%] md:col-span-3 md:col-start-10 md:mt-32 md:w-auto lg:mt-44">
            <Photo photo={photos.cakeSweetPotato} ratio="4/5" sizes="(max-width: 767px) 64vw, 25vw" delay={0.12} />
            <figcaption className="caption">
              {sweetPotato.name}
              <span className="ml-[0.8em] whitespace-nowrap">
                <span className="num">{cakePrice}</span>円
              </span>
            </figcaption>
          </figure>
        </div>

        {/* 2段目：ケーキ（縦・小）と、プレート（横） */}
        <div className="mt-14 grid gap-y-14 md:mt-24 md:grid-cols-12 md:items-end md:gap-x-8">
          <figure className="w-[58%] md:col-span-3 md:col-start-2 md:w-auto">
            <Photo photo={photos.cakeTiramisu} ratio="4/5" sizes="(max-width: 767px) 55vw, 22vw" />
            <figcaption className="caption">
              {tiramisu.name}
              <span className="ml-[0.8em] whitespace-nowrap">
                <span className="num">{cakePrice}</span>円
              </span>
            </figcaption>
          </figure>

          <figure className="md:col-span-6 md:col-start-6">
            <Photo photo={photos.plateTacoRice} ratio="3/2" sizes="(max-width: 767px) 88vw, 46vw" delay={0.12} />
            <figcaption className="caption">曜日プレート。写真はタコライス。</figcaption>
          </figure>
        </div>

        <p className="mt-12 md:mt-16 md:grid md:grid-cols-12 md:gap-x-8">
          <Link href={pages.menu.path} className="more md:col-span-6 md:col-start-6 md:justify-self-start">
            プレートとケーキのメニュー
          </Link>
        </p>
      </div>
    </section>
  );
}
