/**
 * メニュー。
 *
 * 載せるのは、確かめられたものだけ。
 *   ・ケーキ6種の名前と価格 … 店から届いたショーケースの写真の値札（line-23 / 24 / 32）
 *   ・プレート … 名前と価格は確かめられていない。写真に写っている料理を、見たままに説明する
 *   ・ドリンク … 内容を確かめられていないので、品名は載せない
 *
 * 分かったら追記する項目は docs/TODO.md にまとめてある。
 */
import type { PhotoKey } from "./photo-meta";

export type Cake = {
  id: string;
  name: string;
  /** 店頭の値札の金額（円） */
  price: number;
  photo: PhotoKey;
  /** 写真から分かる見た目の説明（味や材料の説明は、確かめられた範囲だけ） */
  look: string;
};

/** ケーキ。値札の日付は 2026年10月（写真が届いた時点） */
export const cakes: Cake[] = [
  {
    id: "sweet-potato-cheesecake",
    name: "スイートポテトチーズケーキ",
    price: 550,
    photo: "cakeSweetPotato",
    look: "表面をこんがり焼いた、ホールから切り分けるチーズケーキ。",
  },
  {
    id: "chocolat-berry-parfait",
    name: "ショコラベリーパルフェ",
    price: 550,
    photo: "cakeChocolatBerry",
    look: "ベリーとクッキーの入ったチョコレートの層を、スポンジにのせて。",
  },
  {
    id: "caramel-cheese-terrine",
    name: "キャラメルチーズテリーヌ",
    price: 550,
    photo: "cakeCaramel",
    look: "キャラメル色の、厚く切ったテリーヌ。",
  },
  {
    id: "matcha-terrine",
    name: "抹茶テリーヌ",
    price: 550,
    photo: "cakeMatcha",
    look: "深い緑の抹茶のテリーヌ。",
  },
  {
    id: "tiramisu-mousse",
    name: "ティラミスムース",
    price: 550,
    photo: "cakeTiramisu",
    look: "白いムースにココアをふった、二層のケーキ。",
  },
  {
    id: "crumble-berry-gateau-chocolat",
    name: "クランブルベリーガトーショコラ",
    price: 550,
    photo: "cakeGateau",
    look: "ベリーを焼き込み、クランブルをのせたガトーショコラ。",
  },
];

/** 値札の金額（6種とも同じ） */
export const cakePrice = 550;
/** 値札を確かめた時期 */
export const cakePriceAsOf = "2026年10月";

/**
 * 店の Instagram で「人気メニュー」として紹介されている2品（2026-09-27 の投稿）。
 * 黒蜜抹茶わらび餅は、価格と内容を確かめられていないので名前だけ。
 */
export const shopFavorites = ["スイートポテトチーズケーキ", "黒蜜抹茶わらび餅"] as const;

export type Plate = {
  id: string;
  /** 写真に写っている料理（正式なメニュー名ではない） */
  label: string;
  photo: PhotoKey;
  /** 皿にのっているもの（写真で見えるものだけ） */
  onPlate: string;
};

/**
 * 曜日プレートの写真。曜日ごとに内容が替わる（店の Instagram の言い方は「曜日プレート」「曜日ランチ」）。
 * どの曜日に何が出るか・価格は確かめられていないので、載せていない。
 */
export const plates: Plate[] = [
  {
    id: "taco-rice",
    label: "タコライス",
    photo: "plateTacoRice",
    onPlate: "アボカドとトマトをのせて。サラダとフライドポテト添え。",
  },
  {
    id: "roast-beef",
    label: "ローストビーフ",
    photo: "plateRoastBeef",
    onPlate: "ごはんにソースを添えて。サラダとフライドポテト付き。",
  },
  {
    id: "omurice",
    label: "オムライス",
    photo: "plateOmurice",
    onPlate: "ふんわりした卵に、ソースをたっぷり。サラダ添え。",
  },
  {
    id: "hamburg",
    label: "ハンバーグ",
    photo: "plateHamburg",
    onPlate: "目玉焼きをのせて。ごはんとサラダ付き。",
  },
  {
    id: "chicken",
    label: "チキン",
    photo: "plateChicken",
    onPlate: "刻んだナッツをのせて。ごはん、サラダ、フライドポテト付き。",
  },
];
