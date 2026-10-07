/**
 * よくある質問（/access に載せる。FAQPage の構造化データもここから作る）。
 * 答えは data/site.ts の値から組み立てる。確かめられていないことは、質問ごと載せない。
 */
import { cakePrice } from "./menu";
import { closedLine, jaTime, parkingLine, paymentLine, site, sundayHours, takeoutPriceText, weekdayHours } from "./site";

export type Faq = { q: string; a: string };

export function buildFaqs(): Faq[] {
  const station = site.access.routes[0];
  const faqs: Faq[] = [
    {
      q: "駐車場はありますか。",
      a: `${parkingLine}分あります。外壁の水色の看板に、駐車場の方向を示す矢印があります。`,
    },
    {
      q: "何時から開いていますか。",
      a: `朝${jaTime(site.hours.weekday.opens)}に開きます。営業時間は${weekdayHours}、日曜と祝日は${sundayHours}です。`,
    },
    {
      q: "定休日はいつですか。",
      a: `定休日は${closedLine}です。月ごとの営業日は、Instagramでお知らせしています。`,
    },
    {
      q: "予約はできますか。",
      a: `${site.reservation.by}で受け付けています。`,
    },
    {
      q: "ケーキだけ、飲みものだけでも利用できますか。",
      a: `できます。食事をしない日でも、ケーキと飲みものだけでどうぞ。ケーキはショーケースに6種類、各${cakePrice}円です。`,
    },
    {
      q: "テイクアウトはできますか。",
      a: `できます。弁当は${site.takeout.kinds}種類で、${takeoutPriceText()}です。${site.takeout.preorderBy.join("か")}で先に注文しておくと、受け取りがスムーズです。`,
    },
    {
      q: "支払いに使えるものは何ですか。",
      a: `${paymentLine}が使えます。`,
    },
    {
      q: "水沢駅から歩いて行けますか。",
      a: `${station.from}からは約${station.km}km、${station.walk}です。${station.car}なので、車かタクシーが便利です。`,
    },
  ];
  return faqs;
}
