import { Photo } from "@/components/ui/Photo";
import { photos } from "@/data/photos";

/**
 * 05 店内。写真に写っているものだけを書く（柱の本数・壁と床の色・席の形・壁の飾り）。
 * 席数や設備（Wi-Fi・電源など）は、確かめられていないので書かない。
 */
export function Space() {
  return (
    <section className="section">
      <div className="wrap">
        {/* スマートフォンは右の端まで、PC は左の端まで伸ばす */}
        <Photo
          photo={photos.interior03}
          ratio="16/10"
          ratioSp="4/3"
          className="max-md:pull-r md:pull-l md:mr-[8%]"
          sizes="(max-width: 767px) 94vw, 86vw"
          quality={85}
        />

        <div className="mt-14 grid gap-y-14 md:mt-20 md:grid-cols-12 md:gap-x-8">
          <div className="md:col-span-5 md:pt-4">
            <h2 className="t-h2">
              <span className="ib">木の柱のある、</span>
              <span className="ib">明るい店内</span>
            </h2>
            <div className="measure mt-8 space-y-6 md:mt-10">
              <p>客席のあいだに、木の柱が4本。空間をゆるやかに分けています。壁はグレー、床は石の色。窓から光が入ります。</p>
              <p>席は、2人掛けと4人掛けのテーブル。壁には、コーヒーカップの線画を飾っています。</p>
            </div>
          </div>

          <div className="grid grid-cols-12 items-start gap-x-4 md:col-span-6 md:col-start-7 md:gap-x-8">
            <div className="col-span-7">
              <Photo photo={photos.counter} ratio="3/4" position="50% 40%" sizes="(max-width: 767px) 54vw, 28vw" />
            </div>
            <div className="col-span-5 mt-16 md:mt-28">
              <Photo photo={photos.wallArt} ratio="3/4" position="40% 30%" sizes="(max-width: 767px) 38vw, 20vw" delay={0.12} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
