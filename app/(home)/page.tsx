/**
 * トップページ。
 *
 * 担当する検索語 … 「水沢 カフェ」（あわせて「奥州市 カフェ」）
 * 役割          … どんな店かを写真で伝え、メニュー・店のこと・アクセスへ送る
 * 書かないこと   … メニューの細かい説明（/menu）、行き方の細かい説明（/access）、店の成り立ち（/about）
 *
 * 区画の順番
 *   01 ヒーロー → 02 はじめに → 03 店の使いかた → 04 メニュー → 05 店内 → 06 写真 → 07 ブログ → 08 店舗情報 → 09 地図
 */
import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { Hero } from "@/components/sections/Hero";
import { Concept } from "@/components/sections/home/Concept";
import { Gallery } from "@/components/sections/home/Gallery";
import { Information } from "@/components/sections/home/Information";
import { Intro } from "@/components/sections/home/Intro";
import { JournalPreview } from "@/components/sections/home/JournalPreview";
import { MenuPreview } from "@/components/sections/home/MenuPreview";
import { Space } from "@/components/sections/home/Space";
import { JsonLd } from "@/components/ui/JsonLd";
import { pages } from "@/data/pages";
import { homeGraph } from "@/lib/schema";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata(pages.home);

export default function HomePage() {
  return (
    <>
      <Header overHero />
      <main id="main">
        <Hero />
        <Intro />
        <Concept />
        <MenuPreview />
        <Space />
        <Gallery />
        <JournalPreview />
        <Information />
      </main>
      <JsonLd graph={homeGraph()} />
    </>
  );
}
