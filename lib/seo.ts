import type { Metadata } from "next";
import { photoOgPath, photoMeta, type PhotoKey } from "@/data/photo-meta";
import type { PageDef } from "@/data/pages";
import { site } from "@/data/site";

/**
 * 公開 URL。next.config.ts が整えた値が入る（プレビュー・手元では undefined）。
 * undefined の間は canonical / og:url / sitemap を出さず、全ページ noindex になる。
 */
export const SITE_URL: string | undefined = process.env.NEXT_PUBLIC_SITE_URL || undefined;

/** 検索エンジンに載せてよい状態か */
export const isIndexable = Boolean(SITE_URL);

/**
 * パスを絶対 URL にする。公開 URL が決まっていなければ undefined。
 * トップは末尾の / を付けない（Next.js が出す canonical・og:url がその形なので、
 * sitemap・構造化データの URL も同じ形にそろえる）。
 */
export function absoluteUrl(path = "/"): string | undefined {
  if (!SITE_URL) return undefined;
  return path === "/" ? SITE_URL : `${SITE_URL}${path}`;
}

export const OG_SIZE = { width: 1200, height: 630 } as const;

type BuildArgs = {
  title: string;
  description: string;
  path: string;
  keywords?: string[];
  /** SNS 用の写真（data/photo-meta.ts のキー） */
  ogPhoto: PhotoKey;
  type?: "website" | "article";
  publishedTime?: string;
  modifiedTime?: string;
  section?: string;
  /** 載せたくないページ（記事の少ない分類の一覧など） */
  noindex?: boolean;
};

/** 全ページ共通の metadata の組み立て。title は完成形を渡す（サイト名の付け足しはしない） */
export function buildMetadata(args: BuildArgs): Metadata {
  const url = absoluteUrl(args.path);
  const ogPath = photoOgPath(args.ogPhoto);
  const images = ogPath ? [{ url: ogPath, ...OG_SIZE, alt: photoMeta[args.ogPhoto].alt }] : undefined;

  return {
    title: { absolute: args.title },
    description: args.description,
    keywords: args.keywords,
    alternates: url ? { canonical: url } : undefined,
    openGraph: {
      title: args.title,
      description: args.description,
      url,
      siteName: site.name,
      locale: "ja_JP",
      type: args.type ?? "website",
      // images のキーは、値があるときだけ置く（undefined のキーがあると、既定の画像まで消える）
      ...(images ? { images } : {}),
      ...(args.type === "article"
        ? { publishedTime: args.publishedTime, modifiedTime: args.modifiedTime, section: args.section }
        : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: args.title,
      description: args.description,
      ...(ogPath ? { images: [ogPath] } : {}),
    },
    // 公開 URL が無い（プレビュー・手元）なら全面的に載せない。本番で個別に外すページは、リンクだけは辿らせる
    robots: !isIndexable ? { index: false, follow: false } : args.noindex ? { index: false, follow: true } : undefined,
  };
}

/** 固定ページの metadata（data/pages.ts の台帳から作る） */
export function pageMetadata(page: PageDef): Metadata {
  return buildMetadata({
    title: page.title,
    description: page.description,
    path: page.path,
    keywords: [page.primaryKeyword, ...page.secondaryKeywords],
    ogPhoto: page.ogPhoto,
  });
}
