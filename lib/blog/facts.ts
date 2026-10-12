/**
 * 店の「事実シート」。
 *
 * 自動投稿の記事が店について書いてよいのは、ここにあることだけ。
 * 値はすべて data/site.ts・data/menu.ts から組み立てる（ここに直接書かない）ので、
 * 営業時間や価格を直せば、プロンプトと検査の両方が同時に変わる。
 */
import { cakePrice, cakes, plates, shopFavorites } from "../../data/menu";
import { fullAddress, hm, jaDate, jaTime, parkingLine, paymentLine, site, sundayHours, takeoutPriceText, todayJst, weekdayHours } from "../../data/site";
import { normalizeDigits } from "./text";

/** プロンプトに渡す、店の事実（文章） */
export function buildFactSheet(today: string = todayJst()): string {
  const { weekday, sundayHoliday } = site.hours;
  const routes = site.access.routes.map((r) => `${r.from}から約${r.km}km（${r.car}${r.walk ? `、${r.walk}` : ""}）`).join("／");

  return [
    `店名: ${site.name}（読み: ${site.reading}）。${site.kind}。`,
    `場所: ${site.address.region}${site.address.locality}${site.address.district}。住所は ${fullAddress}。${site.access.road}。近くに${site.landmark}がある。`,
    `オープン: ${jaDate(site.openedOn)}。`,
    `営業時間: ${weekdayHours}。日曜と祝日は ${sundayHours}。（${jaTime(weekday.opens)}に開き、${jaTime(weekday.closes)}まで。土曜も同じ。日曜と祝日だけ、${jaTime(sundayHoliday.closes)}まで。ラストオーダーは${jaTime(weekday.lastOrder)}と${jaTime(sundayHoliday.lastOrder)}）`,
    `定休日: ${site.hours.closedDay}。ほかに不定休あり。月ごとの営業日は、店のInstagramで告知している。`,
    `駐車場: ${parkingLine}。外壁の水色の看板に、駐車場の方向を示す矢印がある。`,
    `行き方の目安: ${routes}。`,
    `予約: ${site.reservation.by}。`,
    `支払い: ${paymentLine}。`,
    `注文: ${site.ordering}。`,
    `電話: ${site.phone?.display ?? "（載せていない）"}。`,
    `メニュー（昼）: 曜日プレート。曜日ごとに内容が替わる。ごはん・おかず・サラダをひと皿に盛る。写真にある内容は ${plates.map((p) => p.label).join("・")}。ほかにピザの写真がある。`,
    `メニュー（ケーキ）: ${cakes.length}種類、各${cakePrice}円。皿に盛り、クリームとソースを添えて出す。黒い石の皿を使う。`,
    ...cakes.map((c) => `  ・${c.name} … ${c.look}`),
    `店がInstagramで人気のメニューとして紹介しているもの: ${shopFavorites.join("、")}（${shopFavorites[1]}は、名前だけ分かっている）。`,
    `飲みもの: ある。飲みものだけの利用もできる。品名と価格は分かっていない。`,
    `テイクアウト: 弁当${site.takeout.kinds}種類。${takeoutPriceText(today)}。${site.takeout.preorderBy.join("か")}で先に注文できる。ふたに、店名と期限を書いたシールを貼っている。`,
    `店のことば（Instagramより）: 「${site.words.welcome.text}」`,
    `店内: 木の柱が4本。観葉植物。グレーの壁、石の色の床。2人掛けと4人掛けのテーブル席。白いカウンター。壁にコーヒーカップの線画。壁の上のほうに古材風の板。ケーキのショーケースがあり、値札は手書き。`,
    `外観: グレーと黒の外壁。アイアンの飾りがついた水色の扉。水色の看板（コーヒーカップの絵と店名）。入口のわきにオリーブの鉢。`,
    `Instagram: @${site.instagram.handle}`,
  ].join("\n");
}

/** 店について「分かっていないこと」。記事に書いてはいけない */
export const UNKNOWN_FACTS = [
  "席数",
  "飲みものの品名と価格（コーヒーや紅茶の種類を含む）",
  "曜日プレートの価格と、どの曜日に何が出るか",
  "食材の産地、仕入れ先、作り方（手作り・自家製かどうかを含む）",
  "店主やスタッフの名前・経歴・ことば",
  "店名の由来、店を始めた理由",
  "Wi-Fi、電源、禁煙・喫煙、子ども用の椅子、ペット",
  "季節限定のメニュー、新しいメニュー、イベント、割引",
  "混み具合、人気の度合い、来店した人の感想",
];

/** 数字と単位の組を取り出す（例: 550円、9:00、5台、2.2km） */
const UNITS =
  "円|台|種類|種|本|人|名|席|km|キロメートル|キロ|m|メートル|分|時間|時|年|月|日|号|歳|枚|個|杯|品|店舗|軒|皿|切れ|%|パーセント|割|g|グラム|ml|cc|度|階|回|倍|位|点|組|卓";
const TOKEN_RE = new RegExp(`\\d{1,4}:\\d{2}|\\d[\\d,]*(?:\\.\\d+)?\\s*(?:${UNITS})`, "g");

function canonical(token: string): string {
  return token
    .replace(/\s+/g, "")
    .replace(/,/g, "")
    .replace(/種類/, "種")
    .replace(/キロメートル|キロ/, "km")
    .replace(/メートル/, "m")
    .replace(/パーセント/, "%")
    .replace(/グラム/, "g")
    .replace(/名$/, "人");
}

export function numericTokens(text: string): string[] {
  return (normalizeDigits(text).match(TOKEN_RE) ?? []).map(canonical);
}

/**
 * どの記事にも出てくる、数え方としての小さな数（1人、2つ、1杯 など）。事実としては扱わない。
 * 店の事実に使う単位（円・台・種・席・km・分・時・本）は、ここに入れない。
 */
const GENERIC_COUNT = /^[1-3](人|個|杯|皿|品|回|枚|切れ|軒|組|点|度|時間|日)$/;

/** 店について述べる段落に出てよい数値（事実シートにある数値） */
export function allowedShopTokens(today: string = todayJst()): Set<string> {
  const set = new Set<string>(numericTokens(buildFactSheet(today)));
  const { weekday, sundayHoliday } = site.hours;
  // 時刻は、書き方の違い（9:00／9時／09:00）を受け入れる
  for (const t of [weekday.opens, weekday.closes, weekday.lastOrder, sundayHoliday.opens, sundayHoliday.closes, sundayHoliday.lastOrder]) {
    set.add(t);
    set.add(hm(t));
    for (const tok of numericTokens(jaTime(t))) set.add(tok);
  }
  // 「半」を付けた言い方（14時半）の「14時」も、事実の一部として受け入れる
  return set;
}

export function isGenericCount(token: string): boolean {
  return GENERIC_COUNT.test(token);
}

/** 記事全体で書いてよい金額（円）。ケーキの価格と、テイクアウトの価格だけ */
export function allowedYen(): Set<number> {
  return new Set<number>([cakePrice, ...cakes.map((c) => c.price), site.takeout.regularPrice.yen]);
}

/** 記事全体で書いてよい西暦（事実シートと、題材の facts にある年） */
export function allowedYears(extraFacts: string[] = [], today: string = todayJst()): Set<string> {
  const set = new Set<string>();
  const text = normalizeDigits(`${buildFactSheet(today)}\n${extraFacts.join("\n")}`);
  for (const m of text.matchAll(/(\d{4})年/g)) set.add(m[1]);
  // 記事を書いた年（「2026年の秋」のような言い方）
  set.add(today.slice(0, 4));
  return set;
}
