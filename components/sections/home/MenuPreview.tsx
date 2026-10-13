import Link from "next/link";
import { Lines } from "@/components/ui/Lines";
import { Photo } from "@/components/ui/Photo";
import { cakePrice, cakes } from "@/data/menu";
import { pages } from "@/data/pages";
import { photos } from "@/data/photos";

/**
 * 04 メニュー。写真を大きく、商品名は小さく端に。品物を同じ大きさの箱に並べない。
 * 載せるのは、確かめられた名前と価格だけ。
 *
 * 組み方
 *   ・スマートフォン、タブレット … 縦に組む（大きさと寄せる側を、1枚ずつ変える）
 *   ・PC（スクロール連動のアニメーションが使えるブラウザ）… 区画が画面に貼りつき、縦に送った分だけ写真の列が横に流れる。
 *     サイトの中で、横に流れるのはここだけ。使えないブラウザ・動きを減らす設定のときは、PC でも縦に組む。
 *   列の中にはリンクを置かない（画面の外のリンクにキーボードで移れてしまうため）。メニューへのリンクは、下の帯に置く。
 *   動きの決まりは app/globals.css の .hstrip にある。
 */
export function MenuPreview() {
  const sweetPotato = cakes.find((c) => c.id === "sweet-potato-cheesecake")!;
  const caramel = cakes.find((c) => c.id === "caramel-cheese-terrine")!;

  return (
    <section className="section">
      <div className="hstrip">
        <div className="hstrip-pin">
          <p className="t-label hs-idx" data-reveal="wipe">
            <span className="inline-block">
              <span className="n">01</span>Food
              <span className="mx-[0.7em]" aria-hidden="true">
                /
              </span>
              Sweets
            </span>
          </p>

          <div className="hstrip-track">
            <div className="hs-title">
              <h2 className="t-h2" data-reveal="lines">
                <Lines lines={["曜日プレートと、", `${cakes.length}種のケーキ`]} />
              </h2>
              <p className="measure mt-7 md:mt-9">
                昼は、曜日ごとに内容の替わるプレート。ショーケースには、ケーキが{cakes.length}種類並びます。
              </p>
            </div>

            {/*
              sizes の最後の行は PC。横に流れるときの幅（画面の高さで決まる。globals.css の --u × 係数）と、
              縦に組むときの幅（画面の幅で決まる）の、大きいほうを書いてある。どちらの組み方でも、ぼやけない。
            */}
            <figure className="hs-item hs-1 zoom">
              <Photo
                photo={photos.plateRoastBeef}
                ratio="3/2"
                ratioSp="5/4"
                parallax={36}
                sizes="(max-width: 1023px) 96vw, max(65vw, min(90vh, 1056px, 72vw))"
                quality={85}
              />
              <figcaption className="caption">曜日プレート。写真はローストビーフ。</figcaption>
            </figure>

            <figure className="hs-item hs-2 zoom">
              <Photo
                photo={photos.cakeSweetPotato}
                ratio="4/5"
                reveal="right"
                parallax={22}
                sizes="(max-width: 767px) 64vw, (max-width: 1023px) 54vw, max(22vw, min(37.2vh, 437px, 30vw))"
              />
              <figcaption className="caption flex flex-wrap items-baseline gap-x-[0.8em]">
                <span>{sweetPotato.name}</span>
                <span className="whitespace-nowrap">
                  <span className="num">{cakePrice}</span>円
                </span>
              </figcaption>
            </figure>

            <figure className="hs-item hs-3 zoom">
              <Photo photo={photos.plateTacoRice} ratio="4/3" reveal="left" parallax={30} sizes="(max-width: 767px) 86vw, (max-width: 1023px) 78vw, 53vw" />
              <figcaption className="caption">曜日プレート。写真はタコライス。</figcaption>
            </figure>

            <figure className="hs-item hs-4 zoom">
              <Photo
                photo={photos.cakeCaramel}
                ratio="5/6"
                parallax={18}
                sizes="(max-width: 767px) 56vw, (max-width: 1023px) 46vw, max(22vw, min(44.4vh, 521px, 36vw))"
              />
              <figcaption className="caption flex flex-wrap items-baseline gap-x-[0.8em]">
                <span>{caramel.name}</span>
                <span className="whitespace-nowrap">
                  <span className="num">{cakePrice}</span>円
                </span>
              </figcaption>
            </figure>
          </div>

          <div className="hs-foot">
            <span className="hs-progress" aria-hidden="true">
              <i />
            </span>
            <Link href={pages.menu.path} className="more">
              プレートとケーキのメニュー
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
