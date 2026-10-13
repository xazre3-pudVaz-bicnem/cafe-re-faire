import { Lines } from "@/components/ui/Lines";
import { Photo } from "@/components/ui/Photo";
import { photos } from "@/data/photos";
import { site } from "@/data/site";

/**
 * 05 店内。写真に写っているものだけを書く（柱の本数・壁と床の色・席の形・壁の飾り）。
 * 席数や設備（Wi-Fi・電源など）は、確かめられていないので書かない。
 *
 * 組み方：写真集のように、まず大きな1枚。送ると、別の角度の縦長の1枚が右から現れる。
 * 地の上には、店名の後ろ半分を、ごく薄く大きく置いてある（写真がその上に重なる。大きな文字を重ねるのは、ここだけ）。
 */
export function Space() {
  const ghost = site.name.split(" ").slice(1).join(" ");

  return (
    <section className="section">
      {/* 飾りの文字。文字そのものは CSS が data-text から出すので、本文（HTML の文字）には入らない */}
      <div className="ghost space-ghost" aria-hidden="true" data-text={ghost} />

      <div className="wide relative z-[1]">
        <p className="t-label" data-reveal="wipe">
          <span className="inline-block">
            <span className="n">02</span>Space
          </span>
        </p>

        {/* スマートフォンは左の端から、PC は左の端から右に余白を残して */}
        <div className="mt-6 md:mt-8">
          <Photo
            photo={photos.interior03}
            ratio="16/9"
            ratioSp="5/4"
            className="pull-l md:mr-[9%]"
            parallax={52}
            sizes="(max-width: 767px) 94vw, 88vw"
            quality={85}
          />
        </div>

        {/*
          PC（1024px から）は2段の格子。左上に文章、右に縦長の写真（2段ぶち抜き）、左下に小さな写真2枚。
          小さな写真は下の段に置き場所を持たせてある（上へずらして文章に重ねる組み方にはしない。幅によって文章が隠れるため）。
          タブレット（縦）は、スマートフォンと同じ並べ方（PC の並べ方を 768px に当てると、小さな写真が 90px ほどになる）。
        */}
        <div className="mt-14 grid grid-cols-12 gap-x-4 md:mt-24 md:gap-x-8 lg:mt-32 lg:grid-rows-[auto_auto]">
          <div className="col-span-12 lg:col-span-5 lg:col-start-2 lg:row-start-1 lg:pt-16">
            <h2 className="t-h2" data-reveal="lines">
              <Lines lines={["木の柱のある、", "明るい店内"]} />
            </h2>
            <div className="measure mt-8 space-y-6 md:mt-10">
              <p>客席のあいだに、木の柱が4本。空間をゆるやかに分けています。壁はグレー、床は石の色。窓から光が入ります。</p>
              <p>席は、2人掛けと4人掛けのテーブル。壁には、コーヒーカップの線画を飾っています。</p>
            </div>
          </div>

          <div className="col-span-10 col-start-3 mt-14 md:mt-20 lg:col-span-5 lg:col-start-8 lg:row-span-2 lg:row-start-1 lg:mt-0">
            <Photo
              photo={photos.interior02}
              ratio="3/4"
              position="50% 64%"
              className="pull-r"
              reveal="right"
              parallax={40}
              sizes="(max-width: 1023px) 84vw, 44vw"
            />
          </div>

          <div className="col-span-7 mt-12 md:mt-16 lg:col-span-3 lg:col-start-2 lg:row-start-2 lg:self-end">
            <Photo photo={photos.counter} ratio="3/4" position="50% 40%" parallax={24} sizes="(max-width: 1023px) 56vw, 22vw" />
          </div>
          <div className="col-span-5 mt-28 md:mt-40 lg:col-span-2 lg:col-start-6 lg:row-start-2 lg:mb-14 lg:mt-16 lg:self-end">
            <Photo photo={photos.wallArt} ratio="3/4" position="40% 30%" reveal="left" delay={0.12} parallax={14} sizes="(max-width: 1023px) 38vw, 14vw" />
          </div>
        </div>
      </div>
    </section>
  );
}
