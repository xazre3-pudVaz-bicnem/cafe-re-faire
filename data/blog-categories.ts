/**
 * ブログの分類。増やさない（分類が増えると、1つあたりの記事が薄くなる）。
 *
 * auto … 毎日の自動投稿が書いてよい分類か。
 *        「お知らせ」は、営業日や出店など店しか知らない事実なので、人が書く（自動では書かない）。
 */
export type BlogCategory = {
  slug: string;
  name: string;
  /** 一覧ページの説明文（meta description にも使う） */
  description: string;
  auto: boolean;
};

export const blogCategories: BlogCategory[] = [
  {
    slug: "news",
    name: "お知らせ",
    description: "営業日や出店の予定など、Cafe Re faireからのお知らせです。",
    auto: false,
  },
  {
    slug: "menu",
    name: "メニューのこと",
    description: "プレートやケーキにまつわる話。料理やお菓子の名前の由来、選び方、組み合わせ方をまとめています。",
    auto: true,
  },
  {
    slug: "cafe",
    name: "カフェの時間",
    description: "カフェでの過ごし方、はじめての店に入るときのこと、予約や注文のしかた。カフェを気楽に使うための話です。",
    auto: true,
  },
  {
    slug: "mizusawa",
    name: "水沢・奥州のこと",
    description: "店のある水沢と、奥州市のこと。駅や道、まちの成り立ち、出かける先の話を載せています。",
    auto: true,
  },
  {
    slug: "season",
    name: "季節のこと",
    description: "季節の食べものや、その時季の過ごし方。水沢の四季とカフェの話です。",
    auto: true,
  },
  {
    slug: "journal",
    name: "店のこと",
    description: "水色の扉、木の柱、ケーキのショーケース。Cafe Re faireの店の中と外のことを書いています。",
    auto: true,
  },
];

export const categorySlugs: string[] = blogCategories.map((c) => c.slug);

export function categoryBySlug(slug: string): BlogCategory | undefined {
  return blogCategories.find((c) => c.slug === slug);
}
