/**
 * 店舗の情報は、すべてここで管理する。
 *
 * ページ・フッター・構造化データ（JSON-LD）・自動投稿の「事実シート」は、ここから値を取る。
 * 住所・電話・営業時間・料金をページに直接書かないこと（npm run seo:audit が見つける）。
 *
 * 決まり
 *   ・書くのは、出どころを確かめられた事実だけ。出どころは各項目のコメントに残す。
 *   ・確かめられていない項目は null（または空）にする。null の項目は、画面にも構造化データにも出ない。
 *   ・店の考えや来歴を、こちらで作って書かない。分かったら追記する（docs/TODO.md）。
 *
 * 出どころの略号
 *   [IG]     公式 Instagram @refaire_202609 のプロフィール・投稿（2026-10-07 確認）
 *   [GMAP]   Google マップの店舗情報「Cafe Refaire」（2026-10-07 確認）
 *   [TABE]   食べログの店舗ページ（2026-10-07 確認。利用者が編集できる情報）
 *   [PHOTO]  店から届いた写真（assets/source-photos/line-album-2026-10-07）
 */

export const site = {
  /** 店名。看板・Instagram の表示名の書き方 [IG][PHOTO] */
  name: "Cafe Re faire",
  /** 読み [IG][PHOTO 看板・表札] */
  reading: "カフェ ルフェール",
  /**
   * 別の書き方。Google マップと店のハッシュタグは、空白なしの「Cafe Refaire」 [GMAP][IG]
   * 構造化データの alternateName に入れて、同じ店だと伝える。
   */
  alternateNames: ["Cafe Refaire", "カフェ ルフェール", "カフェルフェール"],
  /** 業種 [GMAP]「カフェ・喫茶」 */
  kind: "カフェ",
  /** オープン日 [TABE]。Instagram のオープン記念の告知（9/14〜）とも一致 [IG] */
  openedOn: "2026-09-14",

  /** 住所 [GMAP][TABE]（2つの情報源で一致） */
  address: {
    postalCode: "023-0841",
    region: "岩手県",
    locality: "奥州市",
    /** 「水沢 カフェ」の「水沢」。奥州市のなかの地域名 */
    area: "水沢",
    /** 文章の中で場所を言うときの書き方（番地なし） */
    district: "水沢真城",
    street: "水沢真城町屋敷88-1",
    country: "JP",
  },

  /** 地図上の位置 [GMAP]（店舗のピンの座標） */
  geo: { latitude: 39.12685, longitude: 141.15997 } as { latitude: number; longitude: number } | null,

  /** 電話 [GMAP][TABE]（2つの情報源で一致）。載せないときは null にする */
  phone: { display: "070-2010-6803", e164: "+81-70-2010-6803" } as { display: string; e164: string } | null,

  /** 営業時間 [IG プロフィール]。店から届いた10月の営業カレンダーとも一致 [PHOTO] */
  hours: {
    /** 月・火・木・金・土 */
    weekday: { opens: "09:00", closes: "15:00", lastOrder: "14:30" },
    /** 日曜と祝日 */
    sundayHoliday: { opens: "09:00", closes: "19:00", lastOrder: "18:30" },
    /** 定休日 */
    closedDay: "水曜",
    /** 不定休があるか */
    irregular: true,
  },

  /** 駐車場 [IG プロフィール]「店舗前5台」。看板にも駐車場の案内がある [PHOTO] */
  parking: { spaces: 5, where: "店舗前" },

  /** 支払い方法 [IG 2026-09-27 の投稿]「現金・PayPay・クレジットカードのみ」 */
  payment: ["現金", "PayPay", "クレジットカード"],

  /** 予約 [IG プロフィール]「予約はDMにて」 */
  reservation: { by: "InstagramのDM（ダイレクトメッセージ）" },

  /**
   * テイクアウト [IG]
   *   プロフィール「テイクアウト可」
   *   2026-09-24 の投稿「10月いっぱいまでオープン記念価格／11月からは650円税込／DMまたは電話で事前注文」
   *   10月の営業日の投稿「当店の弁当3種」
   */
  takeout: {
    kinds: 3,
    /** 届いた写真に写っている3種 [PHOTO line-11 / 12]（正式な品名は確かめられていない） */
    seenInPhoto: ["タコライス", "チキン", "ハンバーグ"],
    /** この日からの価格（税込） */
    regularPrice: { from: "2026-11-01", yen: 650 },
    /** この日までは「オープン記念価格」（金額は確認できていない） */
    openingPriceUntil: "2026-10-31",
    preorderBy: ["InstagramのDM", "電話"],
  },

  /** 注文のしかた [PHOTO 店内のテーブルの案内「ご注文はスマホから」] */
  ordering: "席のQRコードを読み取って、スマートフォンから注文",

  /** 店の Instagram [IG] */
  instagram: {
    handle: "refaire_202609",
    url: "https://www.instagram.com/refaire_202609/",
  },

  /**
   * 店のことば。Instagram の投稿から、そのまま引用する（絵文字だけ外している）。
   * こちらで言い換えたり、作ったりしない。
   */
  words: {
    welcome: {
      text: "曜日プレートもおすすめですが、スイーツだけ、ドリンクだけの来店もぜひお待ちしております",
      source: "https://www.instagram.com/p/Dd0Dx2cTK8U/",
      date: "2026-09-27",
    },
  },

  /** 外部の掲載先（同じ店であることを伝えるために、構造化データの sameAs に入れる） */
  listings: {
    googleMaps: "https://www.google.com/maps?cid=13708790877599822867",
    tabelog: "https://tabelog.com/iwate/A0303/A030302/3013573/",
  },

  /** 地図 [GMAP] */
  map: {
    /** 店舗のカード（店名・住所）が出る埋め込み。2026-10-07 に表示を確認 */
    embedUrl: "https://www.google.com/maps?cid=13708790877599822867&hl=ja&z=16&output=embed" as string | null,
    linkUrl: "https://www.google.com/maps?cid=13708790877599822867",
  },

  /** 近くの目印 [GMAP の地図・OpenStreetMap]（店のすぐそばにあるコンビニ） */
  landmark: "デイリーヤマザキ 水沢町屋敷店",

  /**
   * 行き方の目安。
   * 道のりは、Google マップの店舗の位置と各地点のあいだを経路検索して出した値（OpenStreetMap の道路データ）。
   * 時間は、道のりから出した目安（車は市街地の速さ、徒歩は 1分80m）。
   */
  access: {
    /** 店の前の道 [GMAP の地図] */
    road: "国道343号沿い",
    routes: [
      { from: "JR東北本線 水沢駅", km: 2.2, car: "車で5分ほど", walk: "歩いて30分ほど" },
      { from: "東北新幹線 水沢江刺駅", km: 4.4, car: "車で10分ほど", walk: null },
      { from: "東北自動車道 水沢IC", km: 8.3, car: "車で15分ほど", walk: null },
    ],
  },

  // ---- 確かめられていない項目（分かったら値を入れる。null の間はどこにも出ない） ----
  /** 席数 */
  seats: null as number | null,
  /** 禁煙・喫煙 */
  smoking: null as string | null,
  /** Wi-Fi・電源 */
  wifi: null as string | null,
  /** 店名の由来、店主のことば */
  story: null as string | null,
} as const;

/**
 * その月だけの営業日（不定休・時間の変更・出店）。
 * 店の Instagram の告知をもとに、月ごとに追記する。過ぎた月は、置いたままでも画面に出ない。
 *
 * 2026年10月 [IG「10月の営業日」の投稿][PHOTO 営業カレンダー]
 */
export type MonthNotice = {
  /** YYYY-MM */
  month: string;
  /** 定休日（水曜）のほかに休む日 */
  closed: { date: string; reason?: string }[];
  /** 営業時間がいつもと違う日 */
  changed: { date: string; opens: string; closes: string; reason?: string }[];
};

export const monthNotices: MonthNotice[] = [
  {
    month: "2026-10",
    closed: [
      { date: "2026-10-04" },
      { date: "2026-10-13" },
      { date: "2026-10-17", reason: "イベント出店のため" },
      { date: "2026-10-18", reason: "イベント出店のため" },
      { date: "2026-10-31", reason: "マルシェ出店のため" },
    ],
    changed: [
      { date: "2026-10-11", opens: "09:00", closes: "15:00", reason: "日曜ですが、この日は15時まで" },
      { date: "2026-10-12", opens: "09:00", closes: "19:00", reason: "スポーツの日" },
    ],
  },
];

// ---------------------------------------------------------------------------
// 表示用の文字列（組み立ては1か所で。ページに同じ文を2回書かない）
// ---------------------------------------------------------------------------

/** 09:00 → 9:00 */
export function hm(time: string): string {
  return time.replace(/^0/, "");
}

/** 09:00 → 9時、14:30 → 14時30分 */
export function jaTime(time: string): string {
  const [hh, mm] = time.split(":").map(Number);
  return mm ? `${hh}時${mm}分` : `${hh}時`;
}

/** 〒023-0841 岩手県奥州市水沢真城町屋敷88-1 */
export const addressLine = `${site.address.region}${site.address.locality}${site.address.street}`;
export const postalLine = `〒${site.address.postalCode}`;
export const fullAddress = `${postalLine} ${addressLine}`;

export const telHref = site.phone ? `tel:${site.phone.e164.replace(/-/g, "")}` : null;

const h = site.hours;
/** 9:00〜15:00（L.O. 14:30） */
export const weekdayHours = `${hm(h.weekday.opens)}〜${hm(h.weekday.closes)}（L.O. ${hm(h.weekday.lastOrder)}）`;
/** 9:00〜19:00（L.O. 18:30） */
export const sundayHours = `${hm(h.sundayHoliday.opens)}〜${hm(h.sundayHoliday.closes)}（L.O. ${hm(h.sundayHoliday.lastOrder)}）`;
/** 水曜（ほかに不定休あり） */
export const closedLine = `${h.closedDay}${h.irregular ? "（ほかに不定休あり）" : ""}`;
/** 店舗前に5台 */
export const parkingLine = `${site.parking.where}に${site.parking.spaces}台`;
export const paymentLine = site.payment.join("・");

/** 2026-09-14 → 2026年9月14日 */
export function jaDate(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  return `${y}年${m}月${d}日`;
}
/** 2026-09-14 → 2026年9月 */
export function jaMonth(date: string): string {
  const [y, m] = date.split("-").map(Number);
  return `${y}年${m}月`;
}
/** 2026-10-17 → 17日（土） */
export function jaDay(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  const w = "日月火水木金土"[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
  return `${d}日（${w}）`;
}

/** 日本時間の今日 YYYY-MM-DD */
export function todayJst(now: Date = new Date()): string {
  return new Date(now.getTime() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

/** 今月と、これからの月の「その月だけの営業日」（過ぎた月は出さない） */
export function currentMonthNotices(today: string = todayJst()): MonthNotice[] {
  const thisMonth = today.slice(0, 7);
  return monthNotices.filter((n) => n.month >= thisMonth).sort((a, b) => (a.month < b.month ? -1 : 1));
}

/** テイクアウトの価格の言い方（オープン記念の期間が過ぎたら、通常の価格だけにする） */
export function takeoutPriceText(today: string = todayJst()): string {
  const t = site.takeout;
  const regular = `${t.regularPrice.yen}円（税込）`;
  if (today <= t.openingPriceUntil) {
    const [, m, d] = t.openingPriceUntil.split("-").map(Number);
    const [, fm] = t.regularPrice.from.split("-").map(Number);
    return `${m}月${d}日まではオープン記念価格、${fm}月からは${regular}`;
  }
  return regular;
}
