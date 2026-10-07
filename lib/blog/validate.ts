/**
 * 記事の検査。
 *
 * 自動投稿が書いた原稿（lib/blog/pipeline.ts）も、公開済みの記事の点検（scripts/blog/audit.ts）も、
 * 必ずこの1つの関数を通す。規則を2か所に置くと「生成では通ったのに点検で落ちる」ずれが起きるため。
 *
 * 見ていること
 *   A 体裁          … 文字数、見出しの数、h1・画像・生の URL が無いこと
 *   B 定型表現      … AI が書いた記事にありがちな言い回し、感嘆符、絵文字
 *   C 根拠のない主張 … 最上級、口コミ・人気、健康への効果、事実シートに無い金額・年号・割合
 *   D 店の事実      … 店について述べる段落の数値と内容が、事実シートにあるか
 *   E 固有名詞      … 確かめていない施設名・人名を書いていないか
 *   F 内部リンク    … リンク先が実在するか、本数、文言、1か所にまとめて並べていないか
 *   G 重複          … 題名・検索語・本文・見出しの立て方が、既存の記事や固定ページと重なっていないか
 *
 * 店の紹介を、記事の最後に毎回付け足す形も落とす（D の中）。
 * どの記事も同じ「店について」の節で終わると、量産した記事に見えるため。店の話は、題材とつながるところに織り込む。
 */
import { categorySlugs } from "../../data/blog-categories";
import { linkablePaths, pageList, reservedKeywords } from "../../data/pages";
import { site } from "../../data/site";
import { RESERVED_SLUGS, SLUG_PATTERN, type Post } from "./core";
import { allowedShopTokens, allowedYears, allowedYen, buildFactSheet, isGenericCount, numericTokens } from "./facts";
import { dice, h2List, keywordKey, linkTargets, normalize, normalizeDigits, plainText, sentences, shingleOverlap } from "./text";

export type Draft = {
  title: string;
  description: string;
  body: string;
  keywords: string[];
};

export type Target = {
  slug: string;
  category: string;
  focusKeyword: string;
  /** いちばん関係の深い固定ページのパス */
  pillar: string;
  /** この題材で使ってよい、確かめた事実（data/blog-topics.ts の facts） */
  facts?: string[];
  /** news＝人が書いたお知らせ（文字数と検索語の検査をゆるめる） */
  kind?: "article" | "news";
};

export type Problem = { code: string; message: string };

export const LIMITS = {
  title: [16, 40],
  description: [70, 120],
  /** 本文の文字数（記法を除く）。目安は 1,200〜2,000 字 */
  body: [1200, 2300],
  h2: [3, 7],
  fixedLinks: [2, 3],
  relatedLinks: [1, 3],
  keywords: [3, 6],
  /** 1段落の上限 */
  paragraph: 380,
  /** 店名を出す回数（題名・説明文を含む） */
  shopMentions: [1, 8],
  /** 分類「店のこと」の記事での、店名の上限 */
  shopMentionsJournal: 12,
} as const;

const NEWS_LIMITS = { title: [8, 44], description: [40, 120], body: [150, 1600], h2: [0, 6] } as const;

// ---------------------------------------------------------------------------
// B 定型表現
// ---------------------------------------------------------------------------
const STOCK_PHRASES: [RegExp, string][] = [
  [/いかがでした(でしょう)?か|いかがでしょうか/, "「いかがでしたか」"],
  [/(ご)?紹介(し|いた)(ます|ましょう|ていきます)|魅力を(ご)?紹介/, "「〜をご紹介します」"],
  [/参考に(して|なれば|なさって)/, "「参考にしてください」"],
  [/ぜひ.{0,12}(チェック|試して|足を運|訪れて|お越し|ご来店|立ち寄)/, "「ぜひ〜してみてください」の類"],
  [/ではないでしょうか|のではないかと思います/, "「〜ではないでしょうか」"],
  [/この記事では|本記事では|今回の記事|今回は/, "「この記事では」「今回は」"],
  [/(について|を)(詳しく|徹底(的に)?)?解説(し|いた)/, "「〜を解説します」"],
  [/ていきましょう|見ていきます|まとめました|まとめてみました/, "「〜していきましょう」「まとめました」"],
  [/と(言|い)えるでしょう|過言ではありません|間違いありません/, "「〜と言えるでしょう」"],
  [/皆さん|みなさん|皆様|あなた/, "読者への呼びかけ（皆さん・あなた）"],
  [/最高のひととき|特別な(時間|ひととき|空間)|心(温|あたた)まる|こだわりの|至福|癒(や)?しの|ほっと一息|贅沢な(時間|ひととき)|素敵な(時間|ひととき|空間)|ゆったりとした時間/, "どの店にも使える決まり文句"],
  [/[！!]/, "感嘆符"],
  [/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B50}\u{2728}\u{FE0F}]/u, "絵文字"],
  [/徹底(解説|比較|ガイド)|完全(ガイド|版)|保存版|必見|厳選|\d+選|おすすめ\d+/, "煽りの常套句（徹底解説・完全ガイド・◯選など）"],
  [/[♪♡☆★→⇒]/, "飾りの記号"],
];

/** 人が書くお知らせでは見ない定型（店が自分のことばで書くのは自然なため） */
const STOCK_HEADINGS = /^(まとめ|おわりに|終わりに|最後に|さいごに|はじめに|結論|総括|最後にひとこと)$/;

const TITLE_BANNED: [RegExp, string][] = [
  [/おすすめ.{0,6}カフェ|カフェ.{0,4}おすすめ|カフェなら|人気の?カフェ|おしゃれな?カフェ.{0,4}(紹介|特集)/, "「おすすめカフェ」型の題名"],
  [/ランキング|まとめ|\d+選|徹底|完全|必見|保存版/, "煽りの題名"],
  [/【[^】]*】/, "【 】で囲んだ題名"],
];

// ---------------------------------------------------------------------------
// C 根拠のない主張（どこに書いても不可）
// ---------------------------------------------------------------------------
const UNSUPPORTED: [RegExp, string][] = [
  [/No\.?\s?[1１]|ナンバーワン|日本一|東北一|岩手一|奥州一|水沢一|水沢(で)?一番|奥州(市)?(で)?一番/, "「一番」「No.1」"],
  [/一番(人気|おいしい|美味|うまい|おすすめ)|最高(峰|級|の)|究極|至高|唯一無二|絶品|極上|名店|名物店|屈指|随一/, "最上級の形容"],
  [/絶対(に)?(おすすめ|満足|後悔|外さない|食べ)|必ず(満足|気に入)|間違いなし|まちがいなし|はずれなし|ハズレなし/, "「絶対おすすめ」「間違いなし」"],
  [/口コミ|クチコミ|レビュー|高評価|星\d|★/, "口コミ・評価"],
  [/人気店|大人気|話題の(店|カフェ|スポット)|話題沸騰|予約困難|予約が取れない|行列(の|が|店)|連日満席/, "人気・行列"],
  [/ランキング|受賞|グランプリ|金賞|食べログ|ぐるなび|ホットペッパー|Retty|Googleの評価/i, "ランキング・受賞・グルメサイト名"],
  [/雑誌|テレビ|新聞(?!紙)|ラジオ|メディア(掲載|で紹介|に取り上げ)|取材|芸能人|有名人|インフルエンサー/, "メディア掲載・有名人"],
  [/スターバックス|スタバ|ドトール|コメダ|タリーズ|星乃珈琲|サンマルク|マクドナルド|ガスト|サイゼリヤ/, "ほかの店・チェーンの名前"],
  [/(他店|他の店|ほかの店|よその店|ほかのカフェ|他のカフェ|チェーン店).{0,24}(より|比べ|劣|負け|及ば|とは違|違って)/, "ほかの店との比較"],
  [/健康に(良|よ|い)|体に(良|よ|い)い|美容|ダイエット|痩せ|やせる|デトックス|抗酸化|免疫|血糖|脂肪(燃焼|を)|効能|効果(が|も|を|的)|リラックス効果|集中力(が|を)(高|上)|疲労回復|栄養(価|満点)|ヘルシー|低糖質|低カロリー|カロリー(オフ|控えめ|ゼロ)|グルテンフリー|アレルギー(対応|フリー)/, "健康・美容への効果、栄養の表示"],
  [/https?:\/\//, "URL（サイト内のリンクは /path の形で書く）"],
  [/<[a-z][^>]*>/i, "HTML のタグ"],
  [/(明治|大正|昭和|平成|令和)\s?(元|\d+)年/, "元号の年（年は西暦で、事実にあるものだけ書く）"],
  [/[一二三四五六七八九十百千万]+円/, "漢数字の金額（金額は算用数字で、事実にあるものだけ書く）"],
];

// ---------------------------------------------------------------------------
// D 店について書いてはいけないこと（確かめられていない設備・材料・人・提供の条件）
//   店について述べる段落の中で出てきたら不可。「店頭でご確認ください」のように、確認を促す文は可。
// ---------------------------------------------------------------------------
const SHOP_UNVERIFIED: [RegExp, string][] = [
  [/\d+\s*席|席数|満席|個室|半個室|テラス|ソファ|座敷|カウンター席|キッズ(スペース|チェア|メニュー)|子ども用|お子様(ランチ|メニュー|用)|ベビーカー|おむつ|授乳/, "席・子ども向けの設備"],
  [/Wi-?Fi|ワイファイ|電源|コンセント|充電|喫煙|禁煙|分煙|バリアフリー|車いす|多目的トイレ|ペット|犬連れ|貸切|貸し切り/i, "設備（Wi-Fi・電源・禁煙など）"],
  [/手作り|手づくり|自家製|自家焙煎|焼きたて|作りたて|できたて|毎朝|仕込|レシピ|秘伝|こだわ|厳選|産地|県産|国産|地元産|地場|直送|契約農家|無農薬|有機|オーガニック|無添加|前沢牛|江刺りんご/, "材料・作り方"],
  [/店主|オーナー|店長|シェフ|パティシエ|バリスタ|マスター|スタッフ|夫婦|姉妹|家族経営|創業|修業|修行|経歴|脱サラ|想い|思いを込め|願いを込め|コンセプト/, "店の人・来歴・考え"],
  [/限定|新作|新メニュー|新商品|季節の(ケーキ|メニュー|プレート)|日替わり|週替わり|月替わり|売り切れ|完売|予約(必須|不要|優先)|クーポン|割引|キャンペーン|特典|ポイントカード|スタンプ|セットメニュー|ドリンクセット|ケーキセット|ランチセット|おかわり|大盛り|食べ放題|飲み放題/, "提供の条件（限定・セット・割引など）"],
  [/評判|話題|常連|リピーター|行列|混雑|混み合|にぎわ|賑わ|穴場|隠れ家|映え|居心地(が|の)(良|よ|い)|落ち着(いた|ける)(雰囲気|空間)|アットホーム|温かみ/, "評価・混み具合・雰囲気の決めつけ"],
  [/イベント|ワークショップ|ライブ|マルシェ|出店|教室|展示|コラボ/, "イベント"],
  [/モーニング|ディナー|夜カフェ|深夜|アルコール|ビール|ワイン|お酒/, "朝・夜のメニュー、酒"],
  [
    /コーヒー|珈琲|カフェラテ|ラテ|カプチーノ|エスプレッソ|アメリカーノ|紅茶|ハーブティー|ココア|ジュース|スムージー|ソーダ|レモネード|パスタ|スパゲッティ|サンドイッチ|トースト|パンケーキ|ワッフル|フレンチトースト|クレープ|プリン|アイスクリーム|ジェラート|シフォン|タルト|モンブラン|ショートケーキ|ロールケーキ|マフィン|スコーン|クッキー|ドーナツ|カレー|グラタン|ドリア|ガパオ|ロコモコ|唐揚げ|スープ/,
    "事実シートに無い品（飲みものの品名・料理・菓子）",
  ],
];

/** 「確かめてください」と促す文は、確かめられていない内容に触れてよい */
const DEFERRING = /(ご確認|お確かめ|確かめ|お問い合わせ|お尋ね|おたずね|聞いて|たずねて)(ください|いただ|みて|おく|みる|おきたい)|分かっていません|わかりません|確認できていません|載っていません|書かれていません/;

/** 店の人気について書いてよいのは、店自身の紹介として書くときだけ */
const POPULAR = /人気/;
const POPULAR_OK = /Instagram.{0,30}(紹介|挙げ)|(紹介|挙げ).{0,30}Instagram/;

/** 店について述べている文・段落を見分ける語 */
const SHOP_NAME = /Cafe\s?Re\s?faire|カフェ\s?ルフェール|ルフェール/i;
const SHOP_CONTEXT = new RegExp(`${SHOP_NAME.source}|曜日プレート|水色の扉|水色の看板|店舗前`, "i");

// ---------------------------------------------------------------------------
// E 固有名詞（施設名・人名）
// ---------------------------------------------------------------------------
const PLACE_SUFFIX =
  "神社|寺|公園|記念館|博物館|美術館|資料館|遊学館|天文台|観測所|競馬場|ダム|温泉|城跡|城|祭|まつり|川|山|岳|峠|湖|駅|インターチェンジ|商店街|道の駅|小学校|中学校|高校|高等学校|大学|病院|市役所|体育館|球場|スタジアム|アリーナ|牧場|農園|団地";
const PLACE_RE = new RegExp(`[一-龥ァ-ヶー々]{2,12}(?:${PLACE_SUFFIX})`, "g");

/** どの記事に出てきてもよい、土地の名前・一般的な言い方 */
const PLACE_COMMON = [
  "水沢駅", "水沢江刺駅", "真城", "北上川", "新幹線駅", "在来線駅", "最寄駅", "無人駅", "始発駅", "終着駅", "乗換駅",
  "文化祭", "学園祭", "夏祭", "秋祭", "春祭", "収穫祭", "前夜祭", "後夜祭", "誕生祭",
  "児童公園", "国立公園", "国定公園", "自然公園", "歴史公園",
  "総合病院", "大学病院", "動物病院", "小中学校", "専門学校", "活火山",
];

const PERSON_RE = /([一-龥々]{2,5})(さん|氏)/g;
const PERSON_COMMON = ["店員", "職人", "農家", "生産者", "作り手", "学生", "家族", "友人", "友達", "近所", "地元", "皆", "患者", "読者", "利用者", "来店者", "運転手", "配達員", "同僚", "上司", "親御", "奥様", "旦那", "息子", "子供", "先輩", "後輩", "業者", "担当"];
const PERSON_ROLE = /選手|投手|監督|市長|知事|社長|議員|アナウンサー|俳優|女優|歌手|タレント|大谷翔平/;

// ---------------------------------------------------------------------------
// G 検索語の言いかえ（題名や本文に、同じ意味の別の言い方で入っていればよい）
// ---------------------------------------------------------------------------
const SYNONYMS: Record<string, string[]> = {
  とは: [],
  違い: ["違い", "違う", "ちがい", "異な", "別の", "区別"],
  いつ: ["いつ", "時期", "季節", "ころ", "頃", "月"],
  いつまで: ["いつまで", "までに", "うちに", "期限"],
  意味: ["意味", "ことば", "言葉", "語"],
  発祥: ["発祥", "生まれ", "はじまり", "始まり"],
  原料: ["原料", "材料", "から作"],
  特徴: ["特徴", "ちがい", "違い", "らしさ", "口あたり", "食感"],
  魅力: ["魅力", "よさ", "良さ", "利点", "いいところ"],
  コツ: ["コツ", "こつ", "考え方", "ポイント"],
  マナー: ["マナー", "気づかい", "気遣い", "配慮"],
  目安: ["目安", "めやす", "どのくらい"],
  迷う: ["迷", "決め"],
  混む: ["混む", "混み", "混雑"],
  入りにくい: ["入りにく", "入りづら", "ためら"],
  食べる: ["食べ"],
  食べられる: ["食べ"],
  食べごろ: ["食べごろ", "食べ頃"],
  一人: ["一人", "ひとり", "1人"],
  別々: ["別々", "別会計", "それぞれ"],
  お店: ["店"],
  インスタ: ["instagram", "インスタ"],
  dm: ["dm", "ダイレクトメッセージ"],
  qrコード: ["qr"],
  paypay: ["paypay"],
  カフェ: ["カフェ"],
  ケーキ: ["ケーキ", "菓子"],
  お菓子: ["菓子"],
  電話: ["電話"],
  注文: ["注文"],
  準備: ["準備", "支度", "用意"],
  出かける: ["出かけ", "外出"],
  運転: ["運転", "車"],
  支払い: ["支払", "会計"],
  会計: ["会計", "支払"],
  時間: ["時間", "時刻", "時"],
  朝カフェ: ["朝カフェ", "朝のカフェ", "朝、カフェ", "朝にカフェ"],
  帰り: ["帰り", "あと", "後"],
  帰省: ["帰省", "帰る", "里帰り"],
  営業: ["営業"],
  税率: ["税率", "消費税"],
  店内: ["店内", "店で"],
  玄関: ["玄関", "入口", "入り口"],
  アート: ["アート", "絵", "線画"],
  目印: ["目印"],
  名物: ["名物", "特産", "知られ"],
  読み方: ["読み方", "読む", "読み"],
  どこからどこまで: ["結ぶ", "から", "まで"],
  フランス語: ["フランス語"],
  秋: ["秋"],
  夏: ["夏"],
  冬: ["冬"],
};

function hasToken(text: string, token: string): boolean {
  const key = normalize(token);
  const n = normalize(text);
  if (key in SYNONYMS) {
    const list = SYNONYMS[key];
    return list.length === 0 || list.some((w) => n.includes(normalize(w)));
  }
  if (n.includes(key)) return true;
  // 「〜方」（選び方・過ごし方・やり方 など）は、語幹があればよい
  if (/方$/.test(token) && token.length >= 3) return n.includes(normalize(token.slice(0, -1)));
  return false;
}

// ---------------------------------------------------------------------------
// 本文を区画と段落に分ける
// ---------------------------------------------------------------------------
type Block = { heading: string; paragraphs: string[] };

function blocks(body: string): Block[] {
  const out: Block[] = [{ heading: "", paragraphs: [] }];
  let buf: string[] = [];
  const flush = () => {
    if (buf.length) out[out.length - 1].paragraphs.push(buf.join("\n"));
    buf = [];
  };
  for (const line of body.split(/\r?\n/)) {
    const h = line.match(/^##\s+(.+)$/);
    if (h) {
      flush();
      out.push({ heading: h[1], paragraphs: [] });
    } else if (line.trim() === "") {
      flush();
    } else {
      buf.push(line);
    }
  }
  flush();
  return out;
}

/** 店について述べている段落（店名のある区画ぜんぶ、または店を指す語を含む段落） */
export function shopParagraphs(body: string): string[] {
  const out: string[] = [];
  for (const b of blocks(body)) {
    const whole = SHOP_NAME.test(b.heading);
    for (const p of b.paragraphs) if (whole || SHOP_CONTEXT.test(p)) out.push(p);
  }
  return out;
}

const stripLinks = (s: string) => s.replace(/\[([^\]]+)\]\([^)]*\)/g, "$1");

// ---------------------------------------------------------------------------
// 本体
// ---------------------------------------------------------------------------
export function validateArticle(
  draft: Draft,
  target: Target,
  /** ほかの記事（自分自身は含めない） */
  others: Post[],
  /** 記事を書いた日（価格の案内が日付で変わるため） */
  today?: string,
): Problem[] {
  const problems: Problem[] = [];
  const add = (code: string, message: string) => problems.push({ code, message });

  const isNews = target.kind === "news";
  const { title, description, body } = draft;
  const text = plainText(body);
  const all = `${title}\n${description}\n${body}`;
  const allPlain = normalizeDigits(`${title}\n${description}\n${stripLinks(body)}`);
  const h2s = h2List(body);
  const links = linkTargets(body);
  const facts = target.facts ?? [];
  const factSheet = buildFactSheet(today);
  const knownText = `${factSheet}\n${facts.join("\n")}`;
  /** 書いてよい施設・地名（事実シートと題材の事実に出てくる名前、一般的な言い方） */
  const knownPlaces = [...new Set([...(knownText.match(PLACE_RE) ?? []), ...PLACE_COMMON])];
  /** 事実シートに出てくる品名かどうかを見るための文字列（壁の線画の「コーヒーカップ」は品名ではない） */
  const sheetProbe = factSheet.replace(/コーヒーカップ/g, "");

  // ---- A 体裁 --------------------------------------------------------------
  const len = (s: string) => [...s].length;
  const within = (name: string, value: number, [min, max]: readonly [number, number], unit = "字") => {
    if (value < min || value > max) add(`length.${name}`, `${name} は ${min}〜${max}${unit}（いま ${value}${unit}）`);
  };
  const L = isNews ? { ...LIMITS, ...NEWS_LIMITS } : LIMITS;
  within("title", len(title), L.title);
  within("description", len(description), L.description);
  within("body", len(text), L.body);
  within("h2", h2s.length, L.h2, "個");

  if (!SLUG_PATTERN.test(target.slug)) add("slug.format", `slug は半角英小文字・数字・ハイフンで: ${target.slug}`);
  if (RESERVED_SLUGS.includes(target.slug)) add("slug.reserved", `slug「${target.slug}」は使えません`);
  if (others.some((p) => p.slug === target.slug)) add("slug.dup", `slug「${target.slug}」の記事がすでにあります`);
  if (!categorySlugs.includes(target.category)) add("category", `分類が登録にありません: ${target.category}`);
  if (/^#\s+/m.test(body)) add("h1", "本文に h1（# 見出し）を書かない。題名が h1 になる");
  if (/!\[[^\]]*\]\(/.test(body)) add("image", "本文に画像を入れない");
  if (/^#{2,3}\s+.*\[[^\]]+\]\([^)]+\)/m.test(body)) add("heading.link", "見出しの中にリンクを置かない");
  for (const h of h2s) if (STOCK_HEADINGS.test(h.trim())) add("heading.stock", `見出し「${h}」は定型。内容を表す見出しにする`);
  if (new Set(h2s.map(normalize)).size !== h2s.length) add("heading.dup", "同じ見出しが2回ある");
  if (!isNews && /^\s*#{2,3}\s/.test(body)) add("lead", "本文は見出しから始めず、短い書き出しの段落から始める");
  const bodyLines = body.split(/\r?\n/);
  for (let i = 0; i < bodyLines.length; i++) {
    const line = bodyLines[i];
    if (!/^\s*\|/.test(line)) continue;
    const cells = line.trim().replace(/^\||\|$/g, "").split("|");
    if (cells.length > 3) {
      add("table.wide", `表は3列まで（スマートフォンで読めるように）。いま ${cells.length} 列`);
      break;
    }
    // 見出しの行（次の行が |---| の行）に、空のマスがあると、読み上げで列の名前が分からない
    if (/^\s*\|[\s:|-]+\|\s*$/.test(bodyLines[i + 1] ?? "") && cells.some((c) => c.trim() === "")) {
      add("table.header", "表の見出しの行は、すべての列に名前を入れる（左端の列も空にしない）");
      break;
    }
  }
  for (const p of body.split(/\n\s*\n/)) {
    if (!/^(#|\||-|\d+\.|>)/.test(p.trim()) && len(plainText(p)) > LIMITS.paragraph) {
      add("paragraph.long", `段落が長すぎる（${LIMITS.paragraph}字超）: 「${plainText(p).slice(0, 24)}…」`);
    }
  }
  if (!isNews) within("keywords", draft.keywords.length, LIMITS.keywords, "個");

  // ---- B 定型表現 ----------------------------------------------------------
  for (const [re, label] of STOCK_PHRASES) {
    const m = all.match(re);
    if (m) add("stock", `定型表現: ${label}（「${m[0]}」）`);
  }
  if (!isNews && /当店|弊店|私たち|わたしたち|我々|当カフェ/.test(all)) add("stock", `「当店」「私たち」と書かない（店は「${site.name}」と書く）`);
  for (const [re, label] of TITLE_BANNED) {
    const m = title.match(re);
    if (m) add("title.banned", `題名の型: ${label}（「${m[0]}」）`);
  }

  // ---- C 根拠のない主張 ----------------------------------------------------
  for (const [re, label] of UNSUPPORTED) {
    // お知らせでは、店の Instagram へのリンクと、取材・出店の報告を認める
    if (isNews && /URL|メディア/.test(label)) continue;
    const m = allPlain.match(re);
    if (m) add("unsupported", `根拠を示せない表現: ${label}（「${m[0]}」）`);
  }
  const yenOk = allowedYen();
  for (const m of allPlain.matchAll(/(\d[\d,]*)\s*(万)?円/g)) {
    const value = Number(m[1].replace(/,/g, "")) * (m[2] ? 10000 : 1);
    if (!yenOk.has(value)) add("price", `事実シートに無い金額: ${m[0]}（書いてよいのは、ケーキとテイクアウトの価格だけ）`);
  }
  const yearsOk = allowedYears(facts, today);
  for (const m of allPlain.matchAll(/(\d{4})年/g)) {
    if (!yearsOk.has(m[1])) add("year", `確かめていない年: ${m[0]}（年は、事実として渡されたものだけ書く）`);
  }
  const factTokens = new Set(numericTokens(facts.join("\n")));
  for (const m of allPlain.matchAll(/\d+(?:\.\d+)?\s*(?:%|パーセント|割)|\d+世紀|\d+年(前|間|以上|ほど前|の歴史)/g)) {
    const token = numericTokens(m[0])[0] ?? m[0];
    if (!factTokens.has(token) && !facts.some((f) => normalizeDigits(f).includes(m[0]))) {
      add("stat", `確かめていない数値: ${m[0]}（割合・世紀・年数は、事実として渡されたものだけ書く）`);
    }
  }

  // ---- D 店の事実 ----------------------------------------------------------
  // お知らせは、店が新しい事実（休みの日・出店など）を伝えるために人が書くので、ここは見ない
  const shop = isNews ? [] : shopParagraphs(body);
  const allowed = allowedShopTokens(today);
  for (const para of shop) {
    const plain = normalizeDigits(plainText(stripLinks(para).replace(/\n/g, "。")));
    for (const token of numericTokens(plain)) {
      if (allowed.has(token) || factTokens.has(token) || isGenericCount(token)) continue;
      // 年は C で見ている。月は、季節の話として出てくるので事実としては扱わない
      if (/^\d{4}年$/.test(token) || /^\d{1,2}月$/.test(token)) continue;
      add("fact.number", `店について述べる段落に、事実シートに無い数値: 「${token}」（${plain.slice(0, 28)}…）`);
    }
    for (const s of sentences(stripLinks(para))) {
      if (DEFERRING.test(s)) continue;
      // 壁の線画と看板の絵は「コーヒーカップ」。品名としてのコーヒーとは区別する
      const probe = s.replace(/コーヒーカップ/g, "");
      for (const [re, label] of SHOP_UNVERIFIED) {
        if (isNews && /イベント/.test(label)) continue;
        const m = probe.match(re);
        // 事実シートに出てくる語（ケーキの見た目の説明に出てくる材料など）は、書いてよい
        if (m && !sheetProbe.includes(m[0])) add("fact.unverified", `確かめられていない内容（${label}）: 「${m[0]}」…「${s.slice(0, 36)}」`);
      }
      if (POPULAR.test(s) && !POPULAR_OK.test(s)) {
        add("fact.popular", `店の人気について書けるのは「店のInstagramで人気のメニューとして紹介されている」という形だけ: 「${s.slice(0, 36)}」`);
      }
    }
  }
  const shopName = new RegExp(SHOP_NAME.source, "gi");
  const shopMentions = (all.match(shopName) ?? []).length;
  if (!isNews) {
    // 「店のこと」の記事は、店そのものが題材なので、店名が多くなる
    const aboutShop = target.category === "journal";
    const maxMentions = aboutShop ? LIMITS.shopMentionsJournal : LIMITS.shopMentions[1];
    if (shopMentions < LIMITS.shopMentions[0]) add("shop.none", `本文で ${site.name} に一度は触れる（事実シートの範囲で）`);
    if (shopMentions > maxMentions) add("shop.many", `店名が多すぎる（${shopMentions}回。${maxMentions}回まで）。宣伝の文章にしない`);

    // 「この店」「同店」のような言い方は、どの文が店の話かを分からなくする（事実の検査をすり抜ける）
    const implicit = allPlain.match(/同店|当カフェ|このカフェ|こちらのカフェ|この店(では|は|の|に|で|も)|こちらの(お)?店|このお店/);
    if (implicit) add("shop.implicit", `店のことは「${site.name}」と書く（「${implicit[0]}」と書かない）`);

    // 店の紹介を、記事の最後に毎回付け足す形にしない。店の話は、題材とつながるところに織り込む
    const shopHeadings = h2s.filter((h) => SHOP_NAME.test(h));
    if (shopHeadings.length > 1) add("heading.shop-many", `店名の入った見出しは1つまで（いま ${shopHeadings.length} 個）`);
    if (!aboutShop) {
      const allBlocks = blocks(body);
      const lastBlock = allBlocks[allBlocks.length - 1];
      if (h2s.length && SHOP_NAME.test(h2s[h2s.length - 1])) {
        add("heading.shop-last", "最後の見出しに店名を入れない（店の紹介を、記事の最後に付け足さない）");
      }
      const tail = (lastBlock.paragraphs.join("\n").match(shopName) ?? []).length;
      if (allBlocks.length > 1 && tail > 1) {
        add("shop.tail", `最後の節は、題材の話で終える。そこに店名を出すのは1回まで（いま ${tail} 回）。店の話は、記事の途中の、題材とつながるところに移す`);
      }
    }
  }

  // ---- E 固有名詞 ----------------------------------------------------------
  // お知らせは人が書くので、ここは見ない（出店先の学校名などを書くことがある）
  if (!isNews) {
    const seenPlace = new Set<string>();
    for (const m of allPlain.matchAll(PLACE_RE)) {
      const name = m[0];
      if (seenPlace.has(name)) continue;
      seenPlace.add(name);
      // 事実に出てくる名前か、その名前で終わっていればよい（前に地名が付いて長くなった形を受け入れる）
      if (knownText.includes(name) || knownPlaces.some((k) => name.endsWith(k))) continue;
      add("proper.place", `確かめていない施設・地名: 「${name}」（事実として渡された名前だけ書く。無ければ一般的な言い方にする）`);
    }
    const seenPerson = new Set<string>();
    for (const m of allPlain.matchAll(PERSON_RE)) {
      const name = m[1];
      if (seenPerson.has(name) || PERSON_COMMON.some((c) => name.endsWith(c))) continue;
      seenPerson.add(name);
      if (!knownText.includes(name)) add("proper.person", `確かめていない人名: 「${m[0]}」`);
    }
    const role = allPlain.match(PERSON_ROLE);
    if (role && !facts.some((f) => f.includes(role[0]))) add("proper.person", `実在の人物について書かない（「${role[0]}」）`);
  }

  // ---- F 内部リンク --------------------------------------------------------
  const fixedPaths = new Set(linkablePaths);
  const otherSlugs = new Set(others.map((p) => p.slug));
  const fixedUsed = new Set<string>();
  const relatedUsed = new Set<string>();
  for (const { text: label, href } of links) {
    if (!href.startsWith("/")) {
      if (isNews && href.startsWith(site.instagram.url.replace(/\/$/, ""))) continue;
      add("link.external", `サイト外へのリンクは置かない: ${href}`);
      continue;
    }
    const path = href.split("#")[0].replace(/\/$/, "") || "/";
    if (fixedPaths.has(path)) fixedUsed.add(path);
    else if (path.startsWith("/blog/") && otherSlugs.has(path.slice("/blog/".length))) relatedUsed.add(path);
    else add("link.missing", `存在しないページへのリンク: ${href}`);
    if (/^(こちら|ここ|このページ|詳細|詳しくはこちら|リンク|公式サイト|ホームページ)$/.test(label.trim())) {
      add("link.label", `リンクの文言が行き先を表していない: 「${label}」`);
    }
    if (len(label) > 30) add("link.label", `リンクの文言が長すぎる: 「${label.slice(0, 20)}…」`);
  }
  if (!isNews) {
    within("固定ページへのリンク", fixedUsed.size, LIMITS.fixedLinks, "本");
    const relatedMin = Math.min(LIMITS.relatedLinks[0], others.filter((p) => p.category !== "news").length);
    if (relatedUsed.size < relatedMin || relatedUsed.size > LIMITS.relatedLinks[1]) {
      add("link.related", `ほかの記事へのリンクは ${relatedMin}〜${LIMITS.relatedLinks[1]} 本（いま ${relatedUsed.size} 本）`);
    }
    if (!fixedUsed.has(target.pillar)) add("link.pillar", `いちばん関係の深いページ（${target.pillar}）へのリンクが無い`);
  }
  const hrefs = links.map((l) => l.href.split("#")[0]);
  for (const h of new Set(hrefs)) {
    if (hrefs.filter((x) => x === h).length > 2) add("link.repeat", `同じページへのリンクが3回以上: ${h}`);
  }
  // リンクを1か所にまとめて並べない（リンク集に見える）
  if (!isNews) {
    for (const p of body.split(/\n\s*\n/)) {
      const n = linkTargets(p).length;
      if (n > 2) {
        add("link.cluster", `1つの段落にリンクが ${n} 本ある（2本まで）。関係のある文の中に、分けて置く: 「${plainText(p).slice(0, 24)}…」`);
        break;
      }
    }
  }

  // ---- G 重複・検索語 ------------------------------------------------------
  if (!isNews) {
    const tokens = target.focusKeyword.split(/\s+/).filter(Boolean);
    const head = `${title} ${description}`;
    const missing = tokens.filter((t) => !hasToken(all, t));
    if (missing.length) add("keyword.missing", `検索語「${target.focusKeyword}」のうち、本文に無い語: ${missing.join("、")}`);
    const inHead = tokens.filter((t) => hasToken(head, t)).length;
    if (tokens.length && inHead / tokens.length < 0.6) add("keyword.head", `題名と説明文に、検索語「${target.focusKeyword}」の語をもう少し入れる`);
    const exact = normalize(target.focusKeyword.replace(/\s+/g, ""));
    if (exact.length >= 4 && normalize(all).split(exact).length - 1 > 5) add("keyword.stuffing", "検索語をそのままつなげた形が多すぎる");
    const area = (all.match(/水沢の(おしゃれな|人気の|おすすめの)?カフェ|水沢カフェ|水沢\s?カフェ/g) ?? []).length;
    if (area > 4) add("keyword.stuffing", `「水沢のカフェ」という言い方が多すぎる（${area}回）`);

    const key = keywordKey(target.focusKeyword);
    for (const k of reservedKeywords) {
      if (keywordKey(k) === key) add("cannibal.page", `固定ページが受け持つ検索語と同じ: ${k}`);
    }
    for (const p of others) {
      if (!p.focusKeyword) continue;
      if (keywordKey(p.focusKeyword) === key) add("cannibal.post", `記事 ${p.slug} と同じ検索語を狙っている: ${p.focusKeyword}`);
      else if (dice(p.focusKeyword, target.focusKeyword) > 0.8) add("cannibal.post", `記事 ${p.slug} と検索語が近い: ${p.focusKeyword}`);
    }
  }
  for (const p of others) {
    if (p.title === title) add("dup.title", `題名が記事 ${p.slug} と同じ`);
    else if (dice(p.title, title) > 0.62) add("dup.title", `題名が記事 ${p.slug} と近い（「${p.title}」）`);
    if (p.description === description) add("dup.description", `説明文が記事 ${p.slug} と同じ`);
    // お知らせは短く、決まった書き方（営業時間・案内の一文）が重なるので、本文の重なりは見ない
    if (isNews || p.category === "news") continue;
    const overlap = shingleOverlap(plainText(p.body), text);
    if (overlap > 0.2) add("dup.body", `本文が記事 ${p.slug} と重なっている（重なり ${(overlap * 100).toFixed(0)}%）`);
    const theirs = h2List(p.body);
    const same = h2s.filter((h) => theirs.some((x) => dice(x, h) > 0.8)).length;
    if (same >= 3) add("dup.structure", `見出しの立て方が記事 ${p.slug} とほぼ同じ（${same} 個が共通）`);
  }
  for (const p of pageList) {
    if (p.title === title || p.description === description) add("dup.page", `題名か説明文が固定ページ ${p.path} と同じ`);
  }

  return problems;
}
