import Link from "next/link";
import { Lines } from "@/components/ui/Lines";
import { Photo } from "@/components/ui/Photo";
import { pages } from "@/data/pages";
import { photos } from "@/data/photos";
import { jaMonth, jaTime, site } from "@/data/site";

/**
 * 02 はじめに。どこの・いつからの・どんな店かを、短く。
 * 「水沢」「奥州市」「カフェ」は、説明に必要な分だけ出てくる。
 *
 * 組み方：左に小さく土地の名前、右に大きく見出し。その下に、右へ寄せた縦長の扉の写真と、左下の文章。
 * 左右を非対称にして、余白を広く取る。
 */
export function Intro() {
  return (
    <section className="section" id="about">
      <div className="wide grid grid-cols-12 gap-x-4 md:gap-x-8">
        <p className="t-label col-span-12 md:col-span-3 md:pt-[1.6em] lg:pt-[2.6em]" data-reveal="wipe">
          <span className="inline-block">
            Mizusawa
            <span className="mx-[0.7em] text-door-deep" aria-hidden="true">
              /
            </span>
            Iwate
          </span>
        </p>

        <h2 className="lead-title col-span-12 mt-5 md:col-span-9 md:mt-0" data-reveal="lines">
          <Lines lines={["水沢の、", "水色の扉のカフェ。"]} />
        </h2>

        <div className="col-span-12 mt-12 md:col-span-5 md:col-start-8 md:row-start-2 md:mt-24 lg:mt-32">
          <Photo
            photo={photos.blueDoor}
            ratio="4/5"
            position="42% 55%"
            className="pull-r max-md:ml-[14%]"
            parallax={44}
            sizes="(max-width: 767px) 86vw, 46vw"
          />
        </div>

        {/* タブレット（縦）では、文章の列を左の端から6列ぶん取る（5列だと、1行が15字ほどしか入らない） */}
        <div className="col-span-12 mt-10 md:col-span-6 md:col-start-1 md:row-start-2 md:mt-0 md:self-end lg:col-span-4 lg:col-start-3">
          <div className="measure space-y-6">
            <p>
              {site.name}（{site.reading}）は、{site.address.region}
              {site.address.locality}
              {site.address.district}にあるカフェです。{jaMonth(site.openedOn)}にオープンしました。
            </p>
            <p>
              水色の扉をあけると、木の柱と植物のある、明るい店内。曜日ごとに替わるプレートと、ショーケースのケーキ、飲みものを用意しています。
            </p>
            <p>朝は{jaTime(site.hours.weekday.opens)}から。食事でも、ケーキだけでも、どうぞ。</p>
          </div>
          <p className="mt-9">
            <Link href={pages.about.path} className="more">
              {site.name}について
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}
