import { Photo } from "@/components/ui/Photo";
import { photos } from "@/data/photos";
import { site } from "@/data/site";

/**
 * 06 写真。雑誌の写真ページのように、大・中・小を混ぜて、余白をわざと不ぞろいに組む。
 * 同じ大きさの正方形を並べない。写真ごとに視差の量を変えてあるので、送ると、速さの違いで奥行きが出る。
 * スマートフォンも12列の格子に1枚ずつ置き場所を決めている（PC を縮めたものにはしない）。
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

        <div className="mt-10 grid grid-cols-12 items-start gap-x-3 md:mt-20 md:gap-x-8">
          {/* 大：外観 */}
          <div className="col-span-12 md:col-span-7">
            <Photo photo={photos.exterior} ratio="4/3" className="max-md:pull-l" parallax={46} sizes="(max-width: 767px) 94vw, 56vw" quality={85} />
          </div>
          {/* 中：プレート。大の右に、下げて置く */}
          <div className="col-span-7 col-start-6 mt-3 md:col-span-3 md:col-start-9 md:mt-44">
            <Photo photo={photos.plateHamburg} ratio="3/4" position="46% 50%" reveal="right" parallax={18} sizes="(max-width: 767px) 56vw, 24vw" />
          </div>

          {/* 小：店内（斜めから） */}
          <div className="col-span-5 -mt-16 md:col-span-2 md:col-start-2 md:mt-28">
            <Photo photo={photos.interior04} ratio="3/4" position="50% 40%" parallax={56} sizes="(max-width: 767px) 40vw, 16vw" />
          </div>
          {/* 大：ケーキ */}
          <div className="col-span-10 col-start-2 mt-14 md:col-span-5 md:col-start-5 md:mt-12">
            <Photo photo={photos.cakeChocolatBerry} ratio="4/5" position="50% 55%" reveal="left" parallax={30} sizes="(max-width: 767px) 78vw, 40vw" quality={85} />
          </div>
          {/* 小：ショーケースの中 */}
          <div className="col-span-5 col-start-8 mt-3 md:col-span-2 md:col-start-11 md:mt-72">
            <Photo photo={photos.showcase02} ratio="3/4" position="50% 30%" parallax={12} sizes="(max-width: 767px) 40vw, 16vw" />
          </div>

          {/* 幅いっぱい：店内 */}
          <div className="col-span-12 mt-16 md:mt-32">
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
          <div className="col-span-7 mt-3 md:col-span-4 md:col-start-3 md:mt-8">
            <Photo photo={photos.cakeGateau} ratio="4/5" parallax={26} sizes="(max-width: 767px) 56vw, 32vw" />
          </div>
          <div className="col-span-5 mt-20 md:col-span-3 md:col-start-9 md:mt-40">
            <Photo photo={photos.signboard} ratio="3/4" reveal="right" parallax={44} sizes="(max-width: 767px) 40vw, 24vw" />
          </div>
        </div>
      </div>
    </section>
  );
}
