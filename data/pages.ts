/**
 * 固定ページの台帳。title・description・担当する検索語を、ここで一元管理する。
 *
 * 考え方
 *   ・1ページ＝1つの役割。同じ検索語を、複数のページで取り合わない（カニバリゼーションを防ぐ）。
 *   ・primaryKeyword は、そのページが受け持つ検索語。ブログの記事は、ここにある語を狙わない
 *     （lib/blog/validate.ts が、固定ページと同じ検索語の記事を落とす）。
 *   ・title は完成形を書く（サイト名の自動付け足しはしない）。description は 120 字以内。
 *   ・営業時間・台数・価格などの数字は、data/site.ts・data/menu.ts の値から組み立てる
 *     （店の情報を直したとき、検索結果に出る説明文も一緒に変わるように）。
 *   ・固定ページは、この5つだけ。検索のためだけのページを増やさない。
 */
import { cakePrice, cakes } from "./menu";
import type { PhotoKey } from "./photo-meta";
import { jaDate, jaMonth, jaTime, site } from "./site";

export type PageKey = "home" | "menu" | "about" | "access" | "blog";

export type PageDef = {
  key: PageKey;
  path: string;
  /** メニュー・パンくずに出す名前 */
  label: string;
  title: string;
  description: string;
  /** このページが受け持つ検索語（1つ） */
  primaryKeyword: string;
  /** あわせて受ける検索語 */
  secondaryKeywords: string[];
  /** このページの役割（加筆するときに読む） */
  role: string;
  /** SNS で共有されたときの写真 */
  ogPhoto: PhotoKey;
  /** ほかのページからリンクするときの文言（行き先の内容が分かることば） */
  anchor: string;
  /** リンクに添える短い説明 */
  anchorNote: string;
};

const { name, reading } = site;
const { region, locality, area, district } = site.address;
const { weekday, sundayHoliday, closedDay } = site.hours;
const opens = jaTime(weekday.opens);
const parking = `${site.parking.where}に駐車場${site.parking.spaces}台`;
const station = site.access.routes[0];

export const pages: Record<PageKey, PageDef> = {
  home: {
    key: "home",
    path: "/",
    label: "トップ",
    title: `${area}のカフェ ${name}｜プレートとケーキ、朝${opens}から【${locality}】`,
    description: `${region}${locality}${area}のカフェ、${name}（${reading}）。水色の扉が目印です。曜日替わりのプレートと${cakes.length}種のケーキを、木の柱と植物のある店内で。朝${opens}から営業、${parking}。テイクアウトもできます。`,
    primaryKeyword: "水沢 カフェ",
    secondaryKeywords: ["奥州市 カフェ", "奥州市 水沢 カフェ", "水沢 カフェ ルフェール"],
    role: "どんな店かを写真で伝え、メニュー・店のこと・アクセスへ送る。細かい説明は下層に任せる",
    ogPhoto: "interior01",
    anchor: `${area}のカフェ ${name}のトップページ`,
    anchorNote: "店の写真と、営業時間。",
  },
  menu: {
    key: "menu",
    path: "/menu",
    label: "メニュー",
    title: `メニュー｜${area}でランチとケーキ、テイクアウト｜${name}`,
    description: `${locality}${area}のカフェ ${name}のメニュー。曜日ごとに替わるランチプレート、ショーケースに並ぶ${cakes.length}種のケーキ（各${cakePrice}円）、${site.takeout.kinds}種のテイクアウト弁当を写真で紹介します。ケーキだけ、飲みものだけの利用もできます。`,
    primaryKeyword: "水沢 ランチ カフェ",
    secondaryKeywords: ["水沢 ケーキ", "水沢 スイーツ", "水沢 テイクアウト", "奥州市 ランチ"],
    role: "何が食べられるか・いくらか。確かめられたメニューだけを載せる",
    ogPhoto: "cakeSweetPotato",
    anchor: "プレートランチとケーキのメニュー",
    anchorNote: `曜日プレート、ケーキ${cakes.length}種、テイクアウト。`,
  },
  about: {
    key: "about",
    path: "/about",
    label: "店のこと",
    title: `${name}について｜${jaMonth(site.openedOn)}オープン、${locality}${area}のカフェ`,
    description: `${name}（${reading}）は、${jaDate(site.openedOn)}に${region}${locality}${district}にオープンしたカフェです。水色の扉、木の柱と植物のある店内、店での過ごし方を、写真とともに紹介します。`,
    primaryKeyword: "Cafe Re faire",
    secondaryKeywords: ["カフェ ルフェール", "水沢 新しいカフェ", "奥州市 カフェ オープン", "水沢 カフェ 店内"],
    role: "店そのものの説明（どこの・いつからの・どんな店か）。店名で調べた人と、新しい店を探す人に答える",
    ogPhoto: "blueDoor",
    anchor: `${name}の店内と外観`,
    anchorNote: "水色の扉、木の柱、店名の読み方。",
  },
  access: {
    key: "access",
    path: "/access",
    label: "アクセス",
    title: `アクセス・営業時間・駐車場｜${area}のカフェ ${name}`,
    description: `${name}は${locality}${district}、${site.access.road}のカフェです。${area}駅から${station.car}、${parking}。営業は${opens}〜${jaTime(weekday.closes)}（日曜・祝日は${jaTime(sundayHoliday.closes)}まで）、${closedDay}定休。地図と行き方、支払い方法を案内します。`,
    primaryKeyword: "水沢 カフェ 駐車場",
    secondaryKeywords: ["水沢駅 カフェ", "Cafe Re faire 営業時間", "Cafe Re faire 場所", "奥州市 カフェ 駐車場"],
    role: "行き方・営業時間・駐車場・支払い・予約。来店の前に知りたいことに答える（よくある質問もここ）",
    ogPhoto: "exterior",
    anchor: "アクセスと営業時間",
    anchorNote: `地図、駐車場、${area}駅からの行き方、今月の営業日。`,
  },
  blog: {
    key: "blog",
    path: "/blog",
    label: "ブログ",
    title: `ブログ｜${area}のカフェ ${name}から、店と季節のこと`,
    description: `${locality}${area}のカフェ ${name}のブログ。メニューのこと、カフェでの過ごし方、${area}・奥州のこと、季節のこと、店からのお知らせを載せています。`,
    primaryKeyword: "Cafe Re faire ブログ",
    secondaryKeywords: ["水沢 カフェ ブログ"],
    role: "記事の入口。細かい検索語は、1記事1つずつ記事が受け持つ",
    ogPhoto: "counter",
    anchor: "ブログの記事一覧",
    anchorNote: `店のこと、${area}のこと、店からのお知らせ。`,
  },
};

export const pageList: PageDef[] = Object.values(pages);

/** ヘッダー・フッターのメニュー（この順で出す） */
export const navKeys: PageKey[] = ["menu", "about", "access", "blog"];

/** 記事の本文からリンクしてよい固定ページ */
export const linkablePaths: string[] = [pages.home.path, pages.menu.path, pages.about.path, pages.access.path];

/**
 * 固定ページが受け持つ検索語（記事が狙ってはいけない語）。
 * 記事は、これより細かい語（3語以上の組み合わせや、疑問の形）を受け持つ。
 */
export const reservedKeywords: string[] = [
  ...pageList.flatMap((p) => [p.primaryKeyword, ...p.secondaryKeywords]),
  "水沢 カフェ 人気",
  "水沢 おしゃれ カフェ",
  "水沢 コーヒー",
  "水沢 モーニング",
];
