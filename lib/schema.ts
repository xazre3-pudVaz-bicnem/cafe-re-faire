/**
 * 構造化データ（JSON-LD）の組み立て。
 *
 * どのページに何を出すか（これ以上は足さない）
 *   トップ・アクセス … 店を CafeOrCoffeeShop として詳しく（住所・電話・営業時間・地図・座標・支払い・駐車場）
 *   それ以外         … 店を Organization として手短に（店名・公式の掲載先）。
 *                       トップ・アクセスと同じ @id なので、同じ店の「詳しい版」と「簡単な版」になる
 *   全ページ         … WebSite ＋ そのページの WebPage
 *   トップ以外       … BreadcrumbList
 *   メニュー         … Menu（ケーキ6種は価格つき）
 *   アクセス         … FAQPage（サイト内でここだけ）
 *   ブログ           … Blog ／ 記事は BlogPosting
 *
 * 店舗の値はすべて data/site.ts から取る。ここに住所や料金を直接書かないこと。
 * 確かめられていない情報（評価・受賞・席数・価格帯など）は入れない。
 */
import type { Faq } from "@/data/faq";
import { cakes, plates } from "@/data/menu";
import { pages, type PageDef } from "@/data/pages";
import { photoPath, type PhotoKey } from "@/data/photo-meta";
import { currentMonthNotices, site, takeoutPriceText, todayJst } from "@/data/site";
import { absoluteUrl, SITE_URL } from "./seo";

type Node = Record<string, unknown>;

const base = SITE_URL ?? "";
/** 店（＝このサイトの発行元）を指す ID */
export const CAFE_ID = `${base}/#cafe`;
export const WEBSITE_ID = `${base}/#website`;

/** 店の代表写真（構造化データ用） */
const CAFE_PHOTOS: PhotoKey[] = ["interior01", "blueDoor", "cakeSweetPotato", "exterior"];

const abs = (path: string) => absoluteUrl(path) ?? path;

const sameAs = [site.instagram.url, site.listings.googleMaps, site.listings.tabelog];

function postalAddress(): Node {
  return {
    "@type": "PostalAddress",
    postalCode: site.address.postalCode,
    addressRegion: site.address.region,
    addressLocality: site.address.locality,
    streetAddress: site.address.street,
    addressCountry: site.address.country,
  };
}

function openingHours(): Node[] {
  const { weekday, sundayHoliday } = site.hours;
  return [
    {
      "@type": "OpeningHoursSpecification",
      // 定休日（水曜）は入れない
      dayOfWeek: ["Monday", "Tuesday", "Thursday", "Friday", "Saturday"],
      opens: weekday.opens,
      closes: weekday.closes,
    },
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Sunday", "PublicHolidays"],
      opens: sundayHoliday.opens,
      closes: sundayHoliday.closes,
    },
  ];
}

/** その月だけの休み・時間の変更（これからの日付だけ） */
function specialHours(): Node[] {
  const today = todayJst();
  const out: Node[] = [];
  for (const n of currentMonthNotices(today)) {
    for (const c of n.closed) {
      if (c.date < today) continue;
      // 終日休みは、開店と閉店を同じ時刻で書く
      out.push({ "@type": "OpeningHoursSpecification", validFrom: c.date, validThrough: c.date, opens: "00:00", closes: "00:00" });
    }
    for (const c of n.changed) {
      if (c.date < today) continue;
      out.push({ "@type": "OpeningHoursSpecification", validFrom: c.date, validThrough: c.date, opens: c.opens, closes: c.closes });
    }
  }
  return out;
}

/**
 * 店の手短な記述（トップ・アクセス以外のページ）。
 * 店名と、公式の掲載先だけ。住所や営業時間は、トップとアクセスの詳しい記述（同じ @id）に任せる。
 */
export function organizationNode(): Node {
  return {
    "@type": "Organization",
    "@id": CAFE_ID,
    name: site.name,
    alternateName: site.alternateNames,
    url: absoluteUrl("/"),
    sameAs,
  };
}

/** 店の詳しい記述（トップ・アクセス） */
export function cafeNode(): Node {
  const special = specialHours();
  return {
    "@type": "CafeOrCoffeeShop",
    "@id": CAFE_ID,
    name: site.name,
    alternateName: site.alternateNames,
    url: absoluteUrl("/"),
    image: CAFE_PHOTOS.map((k) => abs(photoPath(k))),
    address: postalAddress(),
    ...(site.phone ? { telephone: site.phone.e164 } : {}),
    sameAs,
    description: pages.home.description,
    foundingDate: site.openedOn,
    ...(site.geo ? { geo: { "@type": "GeoCoordinates", latitude: site.geo.latitude, longitude: site.geo.longitude } } : {}),
    hasMap: site.map.linkUrl,
    areaServed: [
      { "@type": "City", name: `${site.address.region}${site.address.locality}` },
      { "@type": "Place", name: `${site.address.locality}${site.address.area}` },
    ],
    openingHoursSpecification: openingHours(),
    ...(special.length ? { specialOpeningHoursSpecification: special } : {}),
    servesCuisine: ["カフェ", "ランチプレート", "ケーキ"],
    hasMenu: absoluteUrl(pages.menu.path),
    currenciesAccepted: "JPY",
    paymentAccepted: site.payment.join(", "),
    acceptsReservations: true,
    amenityFeature: [
      { "@type": "LocationFeatureSpecification", name: `駐車場（${site.parking.where}に${site.parking.spaces}台）`, value: true },
      { "@type": "LocationFeatureSpecification", name: "テイクアウト", value: true },
    ],
  };
}

export function websiteNode(): Node {
  return {
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    url: absoluteUrl("/"),
    name: site.name,
    alternateName: [`${site.name} 公式サイト`, site.reading],
    inLanguage: "ja",
    publisher: { "@id": CAFE_ID },
  };
}

export type Crumb = { name: string; path: string };

export function breadcrumbNode(crumbs: Crumb[], path: string): Node {
  return {
    "@type": "BreadcrumbList",
    "@id": `${abs(path)}#breadcrumb`,
    itemListElement: crumbs.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      item: abs(c.path),
    })),
  };
}

type WebPageType = "WebPage" | "AboutPage" | "ContactPage" | "CollectionPage";

export function webPageNode(args: {
  path: string;
  title: string;
  description: string;
  photo?: PhotoKey;
  type?: WebPageType;
  hasBreadcrumb?: boolean;
}): Node {
  const url = abs(args.path);
  return {
    "@type": args.type ?? "WebPage",
    "@id": `${url}#webpage`,
    url: absoluteUrl(args.path),
    name: args.title,
    description: args.description,
    inLanguage: "ja",
    isPartOf: { "@id": WEBSITE_ID },
    about: { "@id": CAFE_ID },
    ...(args.photo ? { primaryImageOfPage: { "@type": "ImageObject", url: abs(photoPath(args.photo)) } } : {}),
    ...(args.hasBreadcrumb ? { breadcrumb: { "@id": `${url}#breadcrumb` } } : {}),
  };
}

/** メニュー（/menu）。価格を入れるのは、値札を確かめられたケーキと、告知のあったテイクアウトだけ */
export function menuNode(): Node {
  const url = abs(pages.menu.path);
  return {
    "@type": "Menu",
    "@id": `${url}#menu`,
    name: `${site.name} メニュー`,
    inLanguage: "ja",
    url: absoluteUrl(pages.menu.path),
    hasMenuSection: [
      {
        "@type": "MenuSection",
        name: "曜日プレート",
        description: "曜日ごとに内容が替わるランチプレート。",
        hasMenuItem: plates.map((p) => ({
          "@type": "MenuItem",
          name: `${p.label}のプレート`,
          description: p.onPlate,
          image: abs(photoPath(p.photo)),
        })),
      },
      {
        "@type": "MenuSection",
        name: "ケーキ",
        hasMenuItem: cakes.map((c) => ({
          "@type": "MenuItem",
          name: c.name,
          description: c.look,
          image: abs(photoPath(c.photo)),
          offers: { "@type": "Offer", price: c.price, priceCurrency: "JPY" },
        })),
      },
      {
        "@type": "MenuSection",
        name: "テイクアウト",
        description: `弁当${site.takeout.kinds}種。${takeoutPriceText()}。`,
      },
    ],
  };
}

/** FAQPage。サイト内で出すのは /access の1か所だけ */
export function faqNode(path: string, faqs: Faq[]): Node {
  return {
    "@type": "FAQPage",
    "@id": `${abs(path)}#faq`,
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}

/** ブログの一覧（/blog） */
export function blogNode(posts: { slug: string; title: string; publishedAt: string }[]): Node {
  const url = abs(pages.blog.path);
  return {
    "@type": "Blog",
    "@id": `${url}#blog`,
    url: absoluteUrl(pages.blog.path),
    name: `${site.name} ブログ`,
    description: pages.blog.description,
    inLanguage: "ja",
    publisher: { "@id": CAFE_ID },
    blogPost: posts.map((p) => ({
      "@type": "BlogPosting",
      "@id": `${abs(`/blog/${p.slug}`)}#article`,
      headline: p.title,
      url: abs(`/blog/${p.slug}`),
      datePublished: `${p.publishedAt}T09:00:00+09:00`,
    })),
  };
}

/**
 * 記事。書き手と発行元は店。
 * 「店主が書いた」「専門家が監修した」のような、確かめられない肩書きは付けない。
 */
export function blogPostingNode(args: {
  slug: string;
  title: string;
  description: string;
  publishedAt: string;
  updatedAt: string;
  eyecatch: PhotoKey;
  section: string;
  keywords: string[];
}): Node {
  const path = `/blog/${args.slug}`;
  const url = abs(path);
  return {
    "@type": "BlogPosting",
    "@id": `${url}#article`,
    headline: args.title,
    description: args.description,
    image: [abs(photoPath(args.eyecatch))],
    datePublished: `${args.publishedAt}T09:00:00+09:00`,
    dateModified: `${args.updatedAt}T09:00:00+09:00`,
    inLanguage: "ja",
    articleSection: args.section,
    keywords: args.keywords.join(", "),
    mainEntityOfPage: { "@id": `${url}#webpage` },
    isPartOf: { "@id": `${abs(pages.blog.path)}#blog` },
    author: { "@type": "Organization", "@id": CAFE_ID, name: site.name, url: absoluteUrl("/") },
    publisher: { "@id": CAFE_ID },
  };
}

/** トップページ：店（詳しく）＋ WebSite ＋ WebPage */
export function homeGraph(): Node[] {
  const page = pages.home;
  return [cafeNode(), websiteNode(), webPageNode({ path: page.path, title: page.title, description: page.description, photo: page.ogPhoto })];
}

/**
 * 固定ページの標準の組み合わせ：店 ＋ WebSite ＋ WebPage ＋ BreadcrumbList（＋追加分）。
 * detail を付けたページ（アクセス）だけ、店を CafeOrCoffeeShop として詳しく出す。
 */
export function pageGraph(
  page: PageDef,
  extra: Node[] = [],
  options: { type?: WebPageType; detail?: boolean } = {},
): Node[] {
  const crumbs = crumbsFor(page);
  return [
    options.detail ? cafeNode() : organizationNode(),
    websiteNode(),
    webPageNode({
      path: page.path,
      title: page.title,
      description: page.description,
      photo: page.ogPhoto,
      type: options.type,
      hasBreadcrumb: true,
    }),
    breadcrumbNode(crumbs, page.path),
    ...extra,
  ];
}

/** 固定ページのパンくず（トップ ＞ そのページ） */
export function crumbsFor(page: PageDef): Crumb[] {
  return [
    { name: pages.home.label, path: pages.home.path },
    { name: page.label, path: page.path },
  ];
}
