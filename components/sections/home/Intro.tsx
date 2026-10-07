import Link from "next/link";
import { Photo } from "@/components/ui/Photo";
import { pages } from "@/data/pages";
import { photos } from "@/data/photos";
import { jaMonth, jaTime, site } from "@/data/site";

/**
 * 02 はじめに。どこの・いつからの・どんな店かを、短く。
 * 「水沢」「奥州市」「カフェ」は、説明に必要な分だけ出てくる。
 */
export function Intro() {
  return (
    <section className="section no-cv" id="about">
      <div className="wrap grid items-center gap-y-12 md:grid-cols-12 md:gap-x-8">
        <div className="ml-[18%] max-md:pull-r md:col-span-5 md:ml-0">
          <Photo
            photo={photos.blueDoor}
            ratio="4/5"
            position="42% 55%"
            sizes="(max-width: 767px) 82vw, (max-width: 1279px) 40vw, 480px"
          />
        </div>

        <div className="md:col-span-6 md:col-start-7 lg:col-span-5 lg:col-start-8">
          <h2 className="t-h2">
            <span className="ib">水沢の、</span>
            <span className="ib">水色の扉のカフェ。</span>
          </h2>
          <div className="measure mt-8 space-y-6 md:mt-10">
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
          <p className="mt-10">
            <Link href={pages.about.path} className="more">
              {site.name}について
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}
