import { Photo } from "@/components/ui/Photo";
import { photos } from "@/data/photos";
import { site } from "@/data/site";

/**
 * 06 写真。雑誌の写真ページのように、大・中・小を混ぜて、余白をわざと不ぞろいに組む。
 * 同じ大きさの正方形を並べない。写真ごとに視差の量を変えてあるので、送ると、速さの違いで奥行きが出る。
 * スマートフォンも12列の格子に1枚ずつ置き場所を決めている（PC を縮めたものにはしない）。
 * タブレット（縦）は、スマートフォンと同じ並べ方。PC の並べ方（lg:）は 1024px から
 * （768px に当てると、2列ぶんの小さな写真が 90px ほどになってしまう）。
 */
export function Gallery() {
  return (
    <section className="section">
      <div className="wide">
        <p className="t-label" data-reveal="wipe">
          <span className="inline-block">
            <span className="n">03</span>Photographs
          </span>
        </p>
        <h2 className="t-h2 mt-4 md:mt-5">{site.name}の写真</h2>

        <div className="mt-10 grid grid-cols-12 items-start gap-x-3 md:mt-16 md:gap-x-6 lg:mt-20 lg:gap-x-8">
          {/* 大：外観 */}
          <div className="col-span-12 lg:col-span-7">
            <Photo photo={photos.exterior} ratio="4/3" className="max-lg:pull-l" parallax={46} sizes="(max-width: 1023px) 94vw, 53vw" quality={85} />
          </div>
          {/* 中：プレート。大の右に、下げて置く */}
          <div className="col-span-7 col-start-6 mt-3 md:mt-6 lg:col-span-3 lg:col-start-9 lg:mt-44">
            <Photo photo={photos.plateHamburg} ratio="3/4" position="46% 50%" reveal="right" parallax={18} sizes="(max-width: 1023px) 56vw, 22vw" />
          </div>

          {/* 小：店内（斜めから） */}
          <div className="col-span-5 -mt-16 lg:col-span-2 lg:col-start-2 lg:mt-28">
            <Photo photo={photos.interior04} ratio="3/4" position="50% 40%" parallax={56} sizes="(max-width: 1023px) 40vw, 14vw" />
          </div>
          {/* 大：ケーキ */}
          <div className="col-span-10 col-start-2 mt-14 md:mt-20 lg:col-span-5 lg:col-start-5 lg:mt-12">
            <Photo photo={photos.cakeChocolatBerry} ratio="4/5" position="50% 55%" reveal="left" parallax={30} sizes="(max-width: 1023px) 78vw, 37vw" quality={85} />
          </div>
          {/* 小：ショーケースの中 */}
          <div className="col-span-5 col-start-8 mt-3 md:mt-6 lg:col-span-2 lg:col-start-11 lg:mt-72">
            <Photo photo={photos.showcase02} ratio="3/4" position="50% 30%" parallax={12} sizes="(max-width: 1023px) 40vw, 14vw" />
          </div>

          {/* 幅いっぱい：店内 */}
          <div className="col-span-12 mt-16 md:mt-24 lg:mt-32">
            <Photo
              photo={photos.interior01}
              ratio="21/9"
              ratioSp="3/2"
              className="pull-l pull-r"
              parallax={60}
              sizes="100vw"
              quality={85}
            />
          </div>

          {/* 中：ケーキ。小：看板 */}
          <div className="col-span-7 mt-3 md:mt-6 lg:col-span-4 lg:col-start-3 lg:mt-8">
            <Photo photo={photos.cakeGateau} ratio="4/5" parallax={26} sizes="(max-width: 1023px) 56vw, 30vw" />
          </div>
          <div className="col-span-5 mt-20 md:mt-28 lg:col-span-3 lg:col-start-9 lg:mt-40">
            <Photo photo={photos.signboard} ratio="3/4" reveal="right" parallax={44} sizes="(max-width: 1023px) 40vw, 22vw" />
          </div>
        </div>
      </div>
    </section>
  );
}
