/**
 * 配信されている HTML の点検（JavaScript を動かさずに、検索エンジンと同じものを見る）。
 *
 *   1. 本番と同じ設定でビルドして起動する
 *        NEXT_PUBLIC_SITE_URL=https://<本番のドメイン> npm run build
 *        NEXT_PUBLIC_SITE_URL=https://<本番のドメイン> npx next start -p 4321
 *   2. npm run site:check
 *
 * 環境変数
 *   CHECK_URL   点検するサーバー（既定 http://localhost:4321）
 *
 * 見ていること
 *   ・すべてのページが 200 を返す／title・description・canonical・OGP がある／title と description が重なっていない
 *   ・h1 が1つ／見出しの階層が飛んでいない／画像に alt がある
 *   ・構造化データ（JSON-LD）が読める／ページごとに決めた種類が入っている／店の住所・電話が data/site.ts と同じ
 *   ・内部リンクが切れていない／どこからもリンクされていないページが無い
 *   ・トップの最初の画面に、リンクやボタンが無い
 *   ・robots.txt・sitemap.xml・manifest・RSS・自動投稿の入口（鍵が無ければ 401）
 */
import { pageList, pages } from "../data/pages";
import { addressLine, site } from "../data/site";

const BASE = (process.env.CHECK_URL || "http://localhost:4321").replace(/\/+$/, "");

let failures = 0;
const ng = (where: string, message: string) => {
  failures++;
  console.log(`  ✗ ${where} — ${message}`);
};

type PageInfo = {
  path: string;
  status: number;
  html: string;
  title: string;
  description: string;
  canonical: string;
  robots: string;
  h: { level: number; text: string }[];
  links: string[];
  jsonld: Record<string, unknown>[];
  types: string[];
};

const decode = (s: string) =>
  s
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
const strip = (s: string) => decode(s.replace(/<!--[\s\S]*?-->/g, "").replace(/<[^>]+>/g, "")).replace(/\s+/g, " ").trim();
const meta = (html: string, key: string) => {
  const m =
    html.match(new RegExp(`<meta[^>]+(?:name|property)="${key}"[^>]+content="([^"]*)"`, "i")) ??
    html.match(new RegExp(`<meta[^>]+content="([^"]*)"[^>]+(?:name|property)="${key}"`, "i"));
  return m ? decode(m[1]) : "";
};

async function load(path: string): Promise<PageInfo> {
  const res = await fetch(`${BASE}${path}`, { redirect: "manual" });
  const html = await res.text();
  const jsonld: Record<string, unknown>[] = [];
  for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    try {
      const data = JSON.parse(m[1]);
      for (const node of data["@graph"] ?? [data]) jsonld.push(node);
    } catch {
      ng(path, "構造化データ（JSON-LD）を読めません");
    }
  }
  // 本文（body）の中のリンクだけを見る
  const body = html.slice(html.indexOf("<body"));
  return {
    path,
    status: res.status,
    html,
    title: strip(html.match(/<title>([\s\S]*?)<\/title>/)?.[1] ?? ""),
    description: meta(html, "description"),
    canonical: decode(html.match(/<link[^>]+rel="canonical"[^>]+href="([^"]*)"/)?.[1] ?? ""),
    robots: meta(html, "robots"),
    h: [...body.matchAll(/<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/g)].map((m) => ({ level: Number(m[1]), text: strip(m[2]) })),
    links: [...new Set([...body.matchAll(/<a[^>]+href="([^"]+)"/g)].map((m) => decode(m[1])))],
    jsonld,
    types: jsonld.flatMap((n) => (Array.isArray(n["@type"]) ? (n["@type"] as string[]) : [String(n["@type"])])),
  };
}

const internal = (href: string) => href.startsWith("/") && !href.startsWith("//") && !href.startsWith("/_next") && !href.startsWith("/api/");
const pathOf = (href: string) => href.split("#")[0].replace(/\/$/, "") || "/";

async function main() {
  console.log(`点検するサーバー: ${BASE}`);

  // ---- 公開 URL の設定 -------------------------------------------------------
  const robotsTxt = await (await fetch(`${BASE}/robots.txt`)).text();
  const siteUrl = robotsTxt.match(/Sitemap:\s*(\S+)\/sitemap\.xml/i)?.[1];
  if (!siteUrl) {
    console.log("\n公開 URL（NEXT_PUBLIC_SITE_URL）が設定されていないビルドです。");
    console.log("この状態では、全ページが noindex になり、sitemap は空になります（プレビュー用の正しい動きです）。");
    console.log("本番と同じ内容を点検するには、NEXT_PUBLIC_SITE_URL を付けてビルドし直してください。\n");
  }

  // ---- ページを集める（sitemap と、リンクをたどった先） ----------------------
  const sitemapXml = await (await fetch(`${BASE}/sitemap.xml`)).text();
  const sitemapLocs = [...sitemapXml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  const sitemapPaths = sitemapLocs.map((u) => pathOf(new URL(u).pathname));

  const seen = new Map<string, PageInfo>();
  const linkedFrom = new Map<string, Set<string>>();
  const queue = ["/", ...sitemapPaths];
  while (queue.length) {
    const path = queue.shift()!;
    if (seen.has(path)) continue;
    const info = await load(path);
    seen.set(path, info);
    if (info.status !== 200) continue;
    for (const href of info.links.filter(internal)) {
      const p = pathOf(href);
      if (!linkedFrom.has(p)) linkedFrom.set(p, new Set());
      if (p !== path) linkedFrom.get(p)!.add(path);
      if (!seen.has(p) && !/\.(xml|png|jpg|ico|webmanifest)$/.test(p)) queue.push(p);
    }
  }
  const all = [...seen.values()];
  const okPages = all.filter((p) => p.status === 200);
  console.log(`\n1. ページ（${all.length} ページ／sitemap ${sitemapPaths.length} 件）`);

  // ---- 1. 基本 ---------------------------------------------------------------
  const titles = new Map<string, string>();
  const descriptions = new Map<string, string>();
  for (const p of all) {
    if (p.status !== 200) {
      ng(p.path, `状態 ${p.status}（リンク元: ${[...(linkedFrom.get(p.path) ?? [])].slice(0, 3).join(", ") || "sitemap"}）`);
      continue;
    }
    if (!p.title) ng(p.path, "title が無い");
    if (!p.description) ng(p.path, "description が無い");
    if ([...p.description].length > 120) ng(p.path, `description が 120 字を超えている（${[...p.description].length}字）`);
    if (titles.has(p.title)) ng(p.path, `title が ${titles.get(p.title)} と同じ`);
    titles.set(p.title, p.path);
    if (descriptions.has(p.description)) ng(p.path, `description が ${descriptions.get(p.description)} と同じ`);
    descriptions.set(p.description, p.path);

    const noindex = /noindex/.test(p.robots);
    if (siteUrl) {
      // トップは末尾の / なし（Next.js が出す canonical の形）。sitemap の URL も、canonical と1文字も違わないこと
      const expected = `${siteUrl}${p.path === "/" ? "" : p.path}`;
      if (p.canonical !== expected) ng(p.path, `canonical が違う（${p.canonical || "無し"}）`);
      if (meta(p.html, "og:url") !== p.canonical) ng(p.path, "og:url が canonical と違う");
      if (sitemapPaths.includes(p.path) && !sitemapLocs.includes(p.canonical)) ng(p.path, "sitemap の URL が canonical と一致しない");
      if (sitemapPaths.includes(p.path) && noindex) ng(p.path, "sitemap に載っているのに noindex");
      if (!sitemapPaths.includes(p.path) && !noindex && !/\/page\/\d+$/.test(p.path)) ng(p.path, "sitemap に載っていない");
    } else if (!noindex) ng(p.path, "公開 URL が無いのに noindex になっていない");

    for (const key of ["og:title", "og:description", "og:image", "og:type", "og:locale", "og:site_name", "twitter:card", "twitter:image"]) {
      if (!meta(p.html, key)) ng(p.path, `${key} が無い`);
    }
    if (!/<html[^>]+lang="ja"/.test(p.html)) ng(p.path, 'html の lang が "ja" でない');

    // 見出し
    const h1 = p.h.filter((x) => x.level === 1);
    if (h1.length !== 1) ng(p.path, `h1 が ${h1.length} 個（${h1.map((x) => x.text).join(" / ")}）`);
    let prev = 0;
    for (const x of p.h) {
      if (prev && x.level > prev + 1) ng(p.path, `見出しの階層が飛んでいる（h${prev} → h${x.level}「${x.text.slice(0, 20)}」）`);
      if (!x.text) ng(p.path, `空の見出し（h${x.level}）`);
      prev = x.level;
    }

    // 画像の alt
    for (const m of p.html.matchAll(/<img\b[^>]*>/g)) {
      if (!/\balt="/.test(m[0])) ng(p.path, `alt の無い画像: ${m[0].slice(0, 80)}`);
    }
    // 中身の無いリンク
    for (const m of p.html.matchAll(/<a\b[^>]*>([\s\S]*?)<\/a>/g)) {
      if (!strip(m[1]) && !/aria-label=/.test(m[0]) && !/<img[^>]+alt="[^"]+"/.test(m[1])) ng(p.path, `名前の無いリンク: ${m[0].slice(0, 80)}`);
    }
    if (/こちら<\/a>|詳しくはこちら/.test(p.html)) ng(p.path, "「こちら」というリンクの文言がある");
    // 先読みする画像は、最初の画面の1枚まで（ほかの写真と回線を取り合わないように）
    const preloads = [...p.html.matchAll(/<link[^>]+rel="preload"[^>]+as="image"[^>]*>/g)].length;
    if (preloads > 1) ng(p.path, `先読みする画像が ${preloads} 枚ある（1枚まで）`);
  }
  if (!failures) console.log(`  ✓ 状態・title・description・canonical・OGP・h1・見出しの階層・alt`);

  // ---- 2. 内部リンク ---------------------------------------------------------
  console.log("2. 内部リンク");
  const before2 = failures;
  for (const p of okPages) {
    const others = linkedFrom.get(p.path);
    if (p.path !== "/" && (!others || others.size === 0)) ng(p.path, "どのページからもリンクされていない（孤立）");
  }
  for (const p of okPages.filter((x) => x.path.startsWith("/blog/") && !/^\/blog\/(category|page)\//.test(x.path))) {
    const inBody = p.links.filter(internal).map(pathOf);
    for (const must of [pages.access.path, pages.about.path]) {
      if (!inBody.includes(must)) ng(p.path, `記事から ${must} へのリンクが無い`);
    }
    if (!inBody.some((l) => l.startsWith("/blog/") && l !== p.path && !/^\/blog\/(category|page)\//.test(l))) ng(p.path, "ほかの記事へのリンクが無い");
  }
  for (const key of ["menu", "about", "access", "blog"] as const) {
    if (!seen.get("/")?.links.map(pathOf).includes(pages[key].path)) ng("/", `トップから ${pages[key].path} へのリンクが無い`);
  }
  if (failures === before2) console.log(`  ✓ リンク切れなし・孤立したページなし（内部リンクの行き先 ${linkedFrom.size} 件）`);

  // ---- 3. 構造化データ -------------------------------------------------------
  console.log("3. 構造化データ");
  const before3 = failures;
  const expectTypes = (p: PageInfo, types: string[]) => {
    for (const t of types) if (!p.types.includes(t)) ng(p.path, `構造化データに ${t} が無い（あるのは ${p.types.join(", ")}）`);
  };
  for (const p of okPages) {
    // 店の詳しい記述（CafeOrCoffeeShop）はトップとアクセスだけ。ほかは、同じ @id の Organization
    const detailed = p.path === "/" || p.path === pages.access.path;
    expectTypes(p, [detailed ? "CafeOrCoffeeShop" : "Organization", "WebSite"]);
    if (!detailed && p.types.includes("CafeOrCoffeeShop")) ng(p.path, "CafeOrCoffeeShop は、トップとアクセスだけに置く");
    if (p.path !== "/") expectTypes(p, ["BreadcrumbList"]);
    if (p.path === pages.menu.path) expectTypes(p, ["Menu"]);
    if (p.path === pages.access.path) expectTypes(p, ["FAQPage"]);
    if (p.path === pages.about.path) expectTypes(p, ["AboutPage"]);
    if (p.path === pages.blog.path) expectTypes(p, ["Blog"]);
    if (/^\/blog\/[^/]+$/.test(p.path)) expectTypes(p, ["BlogPosting"]);
    if (p.path !== pages.access.path && p.types.includes("FAQPage")) ng(p.path, "FAQPage は /access だけに置く");

    const cafe = p.jsonld.find((n) => String(n["@id"]).endsWith("/#cafe")) as Record<string, unknown> | undefined;
    if (!cafe) {
      ng(p.path, "店を指す記述（@id が /#cafe）が無い");
      continue;
    }
    if (cafe.name !== site.name) ng(p.path, `店名が違う（${cafe.name}）`);
    if (!(cafe.sameAs as string[] | undefined)?.includes(site.instagram.url)) ng(p.path, "sameAs に Instagram が無い");
    if (siteUrl && cafe.url !== siteUrl) ng(p.path, `店の url が公開 URL と違う（${cafe.url}）`);
    if (detailed) {
      const address = cafe.address as Record<string, string> | undefined;
      if (address?.streetAddress !== site.address.street || address?.postalCode !== site.address.postalCode || address?.addressLocality !== site.address.locality) {
        ng(p.path, "構造化データの住所が data/site.ts と違う");
      }
      if (site.phone && cafe.telephone !== site.phone.e164) ng(p.path, "構造化データの電話が data/site.ts と違う");
      // url は、公開 URL が決まっているときだけ出る
      for (const key of ["openingHoursSpecification", "geo", "hasMap", "image", ...(siteUrl ? ["url"] : [])]) {
        if (!cafe[key]) ng(p.path, `店の構造化データに ${key} が無い`);
      }
    }
    // WebSite の発行元と、記事の書き手・発行元が、店の @id を指しているか
    const website = p.jsonld.find((n) => n["@type"] === "WebSite") as { publisher?: { "@id"?: string } } | undefined;
    if (website?.publisher?.["@id"] !== cafe["@id"]) ng(p.path, "WebSite の publisher が店を指していない");
    const posting = p.jsonld.find((n) => n["@type"] === "BlogPosting") as
      | { publisher?: { "@id"?: string }; author?: { "@id"?: string }; datePublished?: string }
      | undefined;
    if (posting && (posting.publisher?.["@id"] !== cafe["@id"] || posting.author?.["@id"] !== cafe["@id"] || !posting.datePublished)) {
      ng(p.path, "BlogPosting の書き手・発行元・公開日が正しくない");
    }
    for (const forbidden of ["aggregateRating", "review", "priceRange", "starRating"]) {
      if (cafe[forbidden]) ng(p.path, `確かめられていない項目（${forbidden}）が構造化データにある`);
    }
    // パンくずの最後が、そのページ自身か
    const crumb = p.jsonld.find((n) => n["@type"] === "BreadcrumbList") as { itemListElement: { item: string }[] } | undefined;
    if (crumb && siteUrl) {
      const last = crumb.itemListElement.at(-1)?.item;
      if (last !== p.canonical) ng(p.path, `パンくずの最後が自分のページでない（${last}）`);
      if (crumb.itemListElement[0]?.item !== siteUrl) ng(p.path, `パンくずの最初がトップでない（${crumb.itemListElement[0]?.item}）`);
    }
  }
  if (failures === before3) console.log("  ✓ ページごとの種類（店の詳しい記述はトップとアクセスだけ）・住所と電話・sameAs・パンくず・発行元");

  // ---- 4. 店舗情報の表記（NAP） ----------------------------------------------
  console.log("4. 店舗情報の表記（店名・住所・電話）");
  const before4 = failures;
  for (const p of okPages) {
    const text = strip(p.html.slice(p.html.indexOf("<body")).replace(/<script[\s\S]*?<\/script>/g, ""));
    if (!text.includes(site.name)) ng(p.path, "店名が無い");
    if (!text.includes(addressLine)) ng(p.path, `住所（${addressLine}）が無い`);
    if (site.phone && !text.includes(site.phone.display)) ng(p.path, "電話番号が無い");
    // 別の書き方の住所・電話が紛れていないか
    for (const m of text.matchAll(/0\d{1,3}-\d{2,4}-\d{4}/g)) {
      if (site.phone && m[0] !== site.phone.display && m[0] !== site.address.postalCode) ng(p.path, `別の電話番号がある: ${m[0]}`);
    }
  }
  if (failures === before4) console.log(`  ✓ 全ページで同じ表記（${addressLine}／${site.phone?.display ?? "電話なし"}）`);

  // ---- 5. トップの最初の画面 -------------------------------------------------
  console.log("5. トップの最初の画面");
  const before5 = failures;
  const home = seen.get("/");
  const hero = home?.html.match(/<section[^>]*data-hero[\s\S]*?<\/section>/)?.[0] ?? "";
  if (!hero) ng("/", "ヒーローの区画が見つからない");
  if (/<a\b|<button\b/.test(hero)) ng("/", "ヒーローの中にリンクかボタンがある");
  if (!/fetchPriority="high"|fetchpriority="high"/i.test(hero)) ng("/", "ヒーローの写真に fetchpriority=high が無い");
  if (/loading="lazy"/.test(hero)) ng("/", "ヒーローの写真が遅延読み込みになっている");
  const heroText = strip(hero);
  if ([...heroText].length > 60) ng("/", `ヒーローの文字が多い（${[...heroText].length}字）: ${heroText}`);
  if (failures === before5) console.log(`  ✓ リンク・ボタンなし／写真は最優先で読み込み／文字は「${heroText}」`);

  // ---- 6. そのほかのファイル -------------------------------------------------
  console.log("6. robots・sitemap・manifest・RSS・自動投稿の入口");
  const before6 = failures;
  if (siteUrl) {
    if (!/Allow: \//.test(robotsTxt) || !/Disallow: \/api\//.test(robotsTxt)) ng("/robots.txt", "Allow / と Disallow /api/ が無い");
    for (const p of pageList) if (!sitemapPaths.includes(p.path)) ng("/sitemap.xml", `${p.path} が載っていない`);
    if (sitemapXml.includes("localhost")) ng("/sitemap.xml", "localhost の URL が入っている");
  } else if (!/Disallow: \/\s*$/m.test(robotsTxt)) ng("/robots.txt", "公開 URL が無いのに、全体を拒否していない");

  const manifest = await fetch(`${BASE}/manifest.webmanifest`);
  if (manifest.status !== 200) ng("/manifest.webmanifest", `状態 ${manifest.status}`);
  else {
    const m = (await manifest.json()) as { icons?: { src: string }[] };
    for (const icon of m.icons ?? []) if ((await fetch(`${BASE}${icon.src}`)).status !== 200) ng("/manifest.webmanifest", `アイコンが無い: ${icon.src}`);
  }
  for (const file of ["/favicon.ico", "/icon.png", "/apple-icon.png"]) {
    if ((await fetch(`${BASE}${file}`)).status !== 200) ng(file, "読めません");
  }
  if (home && !/rel="apple-touch-icon"/.test(home.html)) ng("/", "apple-touch-icon の指定が無い");
  if (home && !/rel="manifest"/.test(home.html)) ng("/", "manifest の指定が無い");
  const feed = await fetch(`${BASE}/blog/feed.xml`);
  if (siteUrl && feed.status !== 200) ng("/blog/feed.xml", `状態 ${feed.status}`);

  // OGP の画像が実在するか（重複は1回だけ見る）
  const ogImages = new Set(okPages.map((p) => meta(p.html, "og:image")).filter(Boolean));
  for (const url of ogImages) {
    const local = url.replace(/^https?:\/\/[^/]+/, BASE);
    if ((await fetch(local, { method: "HEAD" })).status !== 200) ng(url, "OGP の画像が読めません");
  }

  const cron = await fetch(`${BASE}/api/cron/daily-post`);
  if (cron.status !== 401) ng("/api/cron/daily-post", `鍵なしの呼び出しが 401 にならない（${cron.status}）`);
  const cronBad = await fetch(`${BASE}/api/cron/daily-post`, { headers: { Authorization: "Bearer wrong" } });
  if (cronBad.status !== 401) ng("/api/cron/daily-post", `違う鍵の呼び出しが 401 にならない（${cronBad.status}）`);

  const notFound = await fetch(`${BASE}/no-such-page`);
  if (notFound.status !== 404) ng("/no-such-page", `存在しないページが 404 にならない（${notFound.status}）`);
  if (failures === before6) console.log(`  ✓ robots・sitemap・manifest・アイコン・RSS・OGP 画像 ${ogImages.size} 枚・自動投稿の入口は 401・存在しないページは 404`);

  console.log(failures ? `\n問題が ${failures} 件あります。` : "\nすべて通りました。");
  if (failures) process.exit(1);
}

main().catch((e) => {
  console.error(`点検できませんでした: ${(e as Error).message}`);
  console.error("サーバーが起動しているかを確かめてください（npx next start -p 4321）。");
  process.exit(1);
});
