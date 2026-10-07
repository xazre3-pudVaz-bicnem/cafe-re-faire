/** 分類ごとの記事一覧（2ページ目から） */
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CategoryPage, categoryMetadata, resolveCategory } from "@/components/sections/CategoryPage";
import { getActiveCategories, pageCount } from "@/lib/blog";

type Props = { params: Promise<{ category: string; page: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return getActiveCategories().flatMap((c) =>
    Array.from({ length: Math.max(0, pageCount(c.count) - 1) }, (_, i) => ({ category: c.slug, page: String(i + 2) })),
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = await params;
  const r = resolveCategory(p.category, p.page);
  return r ? categoryMetadata(r) : {};
}

export default async function BlogCategoryPagedPage({ params }: Props) {
  const p = await params;
  const r = resolveCategory(p.category, p.page);
  if (!r) notFound();
  return <CategoryPage r={r} />;
}
