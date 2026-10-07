import { pages } from "@/data/pages";
import { site } from "@/data/site";
import { getAllPosts } from "@/lib/blog";
import { absoluteUrl, SITE_URL } from "@/lib/seo";

/** ブログの RSS（新しい順に20本）。ビルド時に一度だけ作る */
export const dynamic = "force-static";

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export function GET() {
  if (!SITE_URL) return new Response("Not found", { status: 404 });

  const posts = getAllPosts().slice(0, 20);
  const items = posts
    .map((p) => {
      const url = absoluteUrl(`/blog/${p.slug}`)!;
      return `    <item>
      <title>${esc(p.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${new Date(`${p.publishedAt}T09:00:00+09:00`).toUTCString()}</pubDate>
      <description>${esc(p.description)}</description>
    </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${esc(`${site.name} ブログ`)}</title>
    <link>${absoluteUrl(pages.blog.path)}</link>
    <description>${esc(pages.blog.description)}</description>
    <language>ja</language>
    <atom:link href="${absoluteUrl("/blog/feed.xml")}" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>
`;
  return new Response(xml, { headers: { "Content-Type": "application/rss+xml; charset=utf-8" } });
}
