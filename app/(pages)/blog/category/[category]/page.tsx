/** 分類ごとの記事一覧（1ページ目） */
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CategoryPage, categoryMetadata, resolveCategory } from "@/components/sections/CategoryPage";
import { getActiveCategories } from "@/lib/blog";

type Props = { params: Promise<{ category: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return getActiveCategories().map((c) => ({ category: c.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const r = resolveCategory((await params).category);
  return r ? categoryMetadata(r) : {};
}

export default async function BlogCategoryPage({ params }: Props) {
  const r = resolveCategory((await params).category);
  if (!r) notFound();
  return <CategoryPage r={r} />;
}
