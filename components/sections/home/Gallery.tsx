import { Photo } from "@/components/ui/Photo";
import { photos } from "@/data/photos";
import { site } from "@/data/site";

/**
 * 06 写真。同じ大きさの正方形を並べず、大小と縦横を混ぜて組む。
 * スマートフォンは2列（一部は2列ぶち抜き）、PC は12列の格子に1枚ずつ置き場所を決めている。
 */
export function Gallery() {
  return (
    <section className="section">
      <div className="wrap">
        <h2 className="t-h2">{site.name}の写真</h2>

        <div className="mt-12 grid grid-cols-2 gap-x-3 gap-y-3 md:mt-16 md:grid-cols-12 md:gap-x-6 md:gap-y-6 lg:gap-x-8 lg:gap-y-8">
          <div className="col-span-2 md:col-span-7">
            <Photo photo={photos.exterior} ratio="4/3" sizes="(max-width: 767px) 92vw, 54vw" />
          </div>
          <div className="md:col-span-4 md:col-start-9 md:mt-20">
            <Photo photo={photos.signboard} ratio="3/4" sizes="(max-width: 767px) 45vw, 30vw" delay={0.1} />
          </div>

          <div className="mt-8 md:col-span-3 md:col-start-2 md:mt-0">
            <Photo photo={photos.interior04} ratio="3/4" position="50% 40%" sizes="(max-width: 767px) 45vw, 22vw" />
          </div>
          <div className="col-span-2 md:col-span-7 md:col-start-6 md:mt-10">
            <Photo photo={photos.cakeMatcha} ratio="4/3" sizes="(max-width: 767px) 92vw, 54vw" delay={0.1} />
          </div>

          <div className="md:col-span-5">
            <Photo photo={photos.showcase01} ratio="1/1" sizes="(max-width: 767px) 45vw, 38vw" />
          </div>
          <div className="mt-8 md:col-span-3 md:mt-24">
            <Photo photo={photos.oliveTree} ratio="3/4" sizes="(max-width: 767px) 45vw, 22vw" delay={0.1} />
          </div>
          <div className="col-span-2 md:col-span-4 md:mt-8">
            <Photo photo={photos.cakeChocolatBerry} ratio="4/5" ratioSp="4/3" position="50% 55%" sizes="(max-width: 767px) 92vw, 30vw" delay={0.2} />
          </div>
        </div>
      </div>
    </section>
  );
}
