/**
 * 何を書くかを決める部分（題材・構成の型・見出し写真・リンクの候補）。
 *
 * どれも、同じ入力なら同じ結果になる（乱数を使わない）。
 * 同じ日に2回動いても同じ題材が選ばれ、同じファイル名になるので、二重に公開されない。
 */
import { blogCategories } from "../../data/blog-categories";
import { topics, type Topic, type TopicCategory } from "../../data/blog-topics";
import { linkablePaths, reservedKeywords } from "../../data/pages";
import { photoKeys, photoMeta, type PhotoKey, type PhotoKind } from "../../data/photo-meta";
import { RESERVED_SLUGS, SLUG_PATTERN, type Post } from "./core";
import { dice, hash, keywordKey } from "./text";

/** 自動投稿が書いてよい分類（お知らせは、人が書く） */
export const AUTO_CATEGORIES: TopicCategory[] = blogCategories.filter((c) => c.auto).map((c) => c.slug as TopicCategory);

/**
 * モデルが新しい題材を提案してよい分類。
 * 「水沢・奥州のこと」は、人が確かめた事実（facts）が要るので、提案させない。
 */
export const PROPOSABLE_CATEGORIES: TopicCategory[] = ["menu", "cafe", "season", "journal"];

// ---------------------------------------------------------------------------
// 構成の型（毎回同じ見出しの立て方にならないように、型を替える）
// ---------------------------------------------------------------------------
export type Format = { id: string; name: string; outline: string };

export const FORMATS: Format[] = [
  {
    id: "answer-first",
    name: "先に答える",
    outline: "書き出しで問いを置き、最初の見出しの下で答えを先に言い切る。そのあと、理由 → 例外や注意 → 店での場面、の順に進める。",
  },
  {
    id: "compare",
    name: "2つを比べる",
    outline: "似ている2つのものを、同じ物差し（2〜3個）で順に比べる。表を1つ使ってよい（3列まで）。最後の節で、迷ったときの考え方を書く。",
  },
  {
    id: "origin",
    name: "由来をたどる",
    outline: "ことばの意味や由来から入り、いまの形になるまでを順にたどる。確かなことだけを書き、分からないことは分からないと書く。",
  },
  {
    id: "scene",
    name: "場面から書く",
    outline: "ある時間帯や状況の、具体的な場面から書き出す。そこから、役に立つ知識へつなげる。最後は、次にとる行動が分かる形で終える。",
  },
  {
    id: "steps",
    name: "順を追う",
    outline: "流れや手順を、番号つきの箇条書きで示す節を1つ入れる。その前後に、なぜそうするのかを文章で書く。",
  },
  {
    id: "notes",
    name: "覚え書き",
    outline: "知っておくと役に立つことを3〜4つ選び、見出し1つにつき1つずつ書く。節は短く、それぞれ独立して読めるようにする。",
  },
];

/** 直近3本と違う型を、題材ごとに決まった順で選ぶ */
export function selectFormat(topic: Topic, posts: Post[]): Format {
  const recent = new Set(posts.filter((p) => p.format).slice(0, 3).map((p) => p.format));
  const start = hash(topic.id) % FORMATS.length;
  for (let i = 0; i < FORMATS.length; i++) {
    const f = FORMATS[(start + i) % FORMATS.length];
    if (!recent.has(f.id)) return f;
  }
  return FORMATS[start];
}

// ---------------------------------------------------------------------------
// 題材
// ---------------------------------------------------------------------------
export function usedKeywordKeys(posts: Post[]): Set<string> {
  return new Set(posts.filter((p) => p.focusKeyword).map((p) => keywordKey(p.focusKeyword)));
}

function isAvailable(topic: Topic, posts: Post[], month: number, usedKeys: Set<string>): boolean {
  // 手書きの原稿がある題材は、自動では書かない
  if (topic.hold) return false;
  if (topic.months && !topic.months.includes(month)) return false;
  if (posts.some((p) => p.slug === topic.id || p.topicId === topic.id)) return false;
  if (usedKeys.has(keywordKey(topic.focusKeyword))) return false;
  return true;
}

/**
 * 今日書く題材の候補を、優先する順に返す。
 *   ・まだ書いていない題材だけ（slug・題材 ID・検索語のどれかが使われていたら外す）
 *   ・季節の題材は、その月にだけ出す
 *   ・いちばん長く書いていない分類を先にする（同じ分類が続かないように）
 *   ・分類の中の順番は、日付と題材 ID から決める（日が変われば順番も変わる）
 * 先頭が今日の題材。2番目からは、先頭で原稿が通らなかったときの控え（別の分類から選ぶ）。
 */
export function selectTopics(posts: Post[], date: string, forcedId?: string): Topic[] {
  if (forcedId) {
    const forced = topics.find((t) => t.id === forcedId);
    return forced ? [forced] : [];
  }
  const month = Number(date.slice(5, 7));
  const usedKeys = usedKeywordKeys(posts);
  const pool = topics.filter((t) => isAvailable(t, posts, month, usedKeys));
  if (pool.length === 0) return [];

  // 分類ごとに、最後に書いてから何本たったか（一度も書いていなければ最優先）
  const articles = posts.filter((p) => p.category !== "news");
  const age = (cat: string) => {
    const i = articles.findIndex((p) => p.category === cat);
    return i === -1 ? Number.POSITIVE_INFINITY : i;
  };
  const cats = AUTO_CATEGORIES.filter((c) => pool.some((t) => t.category === c)).sort(
    (a, b) => age(b) - age(a) || AUTO_CATEGORIES.indexOf(a) - AUTO_CATEGORIES.indexOf(b),
  );

  const byCat = new Map<string, Topic[]>(
    cats.map((c) => [c, pool.filter((t) => t.category === c).sort((a, b) => hash(`${date}:${a.id}`) - hash(`${date}:${b.id}`))]),
  );

  // 分類を順にめぐって1つずつ取る（控えが、先頭と別の分類になるように）
  const out: Topic[] = [];
  for (let round = 0; out.length < pool.length; round++) {
    let took = false;
    for (const c of cats) {
      const t = byCat.get(c)![round];
      if (t) {
        out.push(t);
        took = true;
      }
    }
    if (!took) break;
  }
  return out;
}

/** 用意した題材が、あと何本残っているか（季節に関係なく数える） */
export function remainingTopics(posts: Post[]): number {
  const usedKeys = usedKeywordKeys(posts);
  return topics.filter((t) => !t.hold && !posts.some((p) => p.slug === t.id || p.topicId === t.id) && !usedKeys.has(keywordKey(t.focusKeyword))).length;
}

// ---------------------------------------------------------------------------
// 新しい題材の提案（用意した題材を書き終えたあと）を確かめる
// ---------------------------------------------------------------------------
export type ProposedTopic = {
  id: string;
  category: string;
  focusKeyword: string;
  angle: string;
  pillar: string;
  photoKind: string;
};

const PROPOSAL_BANNED =
  /おすすめ|人気|ランキング|口コミ|評判|安い|格安|穴場|隠れ家|個室|Wi-?Fi|電源|モーニング|ディナー|コーヒー豆|自家焙煎|ラテアート|デート|インスタ映え|映え|食べ放題|飲み放題|求人|バイト|\d+選|No\.?1/i;

const PHOTO_KINDS: PhotoKind[] = ["interior", "exterior", "cake", "plate", "takeout"];

export function checkProposedTopic(raw: ProposedTopic, posts: Post[]): { topic?: Topic; errors: string[] } {
  const errors: string[] = [];
  const id = raw.id.trim().toLowerCase();
  if (!SLUG_PATTERN.test(id) || id.split("-").length < 2 || id.length > 60) errors.push("id は半角英小文字とハイフンで、2語以上・60字以内");
  if (RESERVED_SLUGS.includes(id)) errors.push(`id「${id}」は使えない`);
  if (posts.some((p) => p.slug === id) || topics.some((t) => t.id === id)) errors.push(`id「${id}」はすでにある`);

  const keyword = raw.focusKeyword.trim().replace(/[\s　]+/g, " ");
  const words = keyword.split(" ").filter(Boolean);
  if (words.length < 2 || words.length > 4) errors.push("検索語は 2〜4 語（空白で区切る）");
  const key = keywordKey(keyword);
  const used = [...posts.map((p) => p.focusKeyword).filter(Boolean), ...topics.map((t) => t.focusKeyword), ...reservedKeywords];
  for (const u of used) {
    if (keywordKey(u) === key) errors.push(`検索語「${keyword}」は、すでに使われている`);
    else if (dice(u, keyword) > 0.8) errors.push(`検索語「${keyword}」は「${u}」に近すぎる`);
  }
  const banned = `${keyword} ${raw.angle}`.match(PROPOSAL_BANNED);
  if (banned) errors.push(`店の事実に無いこと・評価のことばを前提にした題材は不可（「${banned[0]}」）`);

  if (!PROPOSABLE_CATEGORIES.includes(raw.category as TopicCategory)) errors.push(`分類は ${PROPOSABLE_CATEGORIES.join(" / ")} のどれか`);
  if (!linkablePaths.includes(raw.pillar)) errors.push(`pillar は ${linkablePaths.join(" , ")} のどれか`);
  if (!PHOTO_KINDS.includes(raw.photoKind as PhotoKind)) errors.push(`photoKind は ${PHOTO_KINDS.join(" / ")} のどれか`);
  if ([...raw.angle.trim()].length < 20) errors.push("angle（何に答える記事か）を、もう少し具体的に書く");

  if (errors.length) return { errors: [...new Set(errors)] };
  return {
    errors,
    topic: {
      id,
      category: raw.category as TopicCategory,
      focusKeyword: keyword,
      angle: raw.angle.trim(),
      pillar: raw.pillar as Topic["pillar"],
      photoKinds: [raw.photoKind as PhotoKind],
    },
  };
}

/** 新しい題材を提案させる分類（記事がいちばん少ない分類。直前の記事とは別にする） */
export function categoryForProposal(posts: Post[]): TopicCategory {
  const last = posts.find((p) => p.category !== "news")?.category;
  const count = (c: string) => posts.filter((p) => p.category === c).length;
  return [...PROPOSABLE_CATEGORIES].filter((c) => c !== last).sort((a, b) => count(a) - count(b))[0];
}

// ---------------------------------------------------------------------------
// 見出し写真
// ---------------------------------------------------------------------------
/**
 * 題材ごとの見出し写真（内容と関係のある写真を、あらかじめ決めておく）。
 * ここに無い題材（モデルが提案した題材）は、photoKinds に合う写真の中から選ぶ。
 */
export const TOPIC_PHOTO: Record<string, PhotoKey> = {
  // メニューのこと
  "terrine-cake-toha": "cakeMatcha",
  "taco-rice-hassho": "plateTacoRice",
  "gateau-chocolat-brownie-chigai": "cakeGateau",
  "tiramisu-imi": "cakeTiramisu",
  "cheesecake-shurui-chigai": "cakeSweetPotato",
  "sweet-potato-cheesecake-kumiawase": "cakeSweetPotato",
  "caramel-karameru-chigai": "cakeCaramel",
  "matcha-ryokucha-chigai": "cakeMatcha",
  "crumble-toha": "cakeGateau",
  "parfait-pafe-chigai": "cakeChocolatBerry",
  "mousse-cake-tokucho": "cakeTiramisu",
  "assiette-dessert-toha": "cakeCaramel",
  "slate-plate-cake": "cakeMatcha",
  "omurice-hassho": "plateOmurice",
  "hamburg-hamburger-chigai": "plateHamburg",
  "roast-beef-toha": "plateRoastBeef",
  "one-plate-lunch-miryoku": "plateChicken",
  "youbi-gawari-lunch": "plateRoastBeef",
  "pizza-pizza-chigai": "pizza",
  "cake-erabikata-cafe": "showcase01",
  "warabimochi-toha": "showcase01",
  "kuromitsu-toha": "showcase01",
  "chantilly-cream-toha": "cakeGateau",
  "cake-mint-taberu": "cakeMatcha",
  "berry-shurui-chigai": "cakeChocolatBerry",
  "dessert-sweets-chigai": "showcase01",
  "avocado-tabegoro": "plateTacoRice",
  "cake-tabekata-fork": "cakeCaramel",
  "lunch-plate-moritsuke": "plateHamburg",
  // カフェの時間
  "cafe-cake-dake": "showcase01",
  "cafe-hitori-hairikata": "interior02",
  "cafe-taizai-jikan": "interior03",
  "qr-order-yarikata": "interior03",
  "instagram-dm-yoyaku": "entranceSign",
  "takeout-denwa-chumon": "takeout01",
  "asa-cafe-sugoshikata": "blueDoor",
  "cafe-lunch-komu-jikan": "plateChicken",
  "nichiyo-yugata-cafe": "interior01",
  "cafe-dokusho-manner": "interior02",
  "cafe-pc-sagyo-manner": "interior01",
  "cafe-kozure-manner": "interior03",
  "cafe-shashin-manner": "cakeChocolatBerry",
  "cafe-paypay-shiharai": "counter",
  "cafe-kaikei-betsubetsu": "counter",
  "last-order-imi": "interior02",
  "futeikyu-toha": "entranceSign",
  "cafe-kissaten-chigai": "interior01",
  "takeout-bento-itsumade": "takeout01",
  "oyatsu-jikan-cafe": "cakeTiramisu",
  "instagram-highlight-mikata": "signboard",
  "takeout-tennai-zeiritsu": "takeout01",
  // 水沢・奥州のこと（土地の写真は無いので、店の外観を使う）
  "mizusawa-eki-mizusawaesashi-eki-chigai": "signboard",
  "mizusawashi-oshushi-chigai": "exterior",
  "mizusawa-shinjo-yomikata": "signboard",
  "kokudo-343-dokokara": "parkingSign",
  "mizusawa-san-ijin": "exterior",
  "nambu-tekki-mizusawa": "blueDoor",
  "mizusawa-ido-kansokujo": "exterior",
  "hidaka-hibuse-matsuri-toha": "oliveTree",
  "oshushi-meibutsu": "signboard",
  "isawa-sankyo-shuraku": "oliveTree",
  "esashi-fujiwara-no-sato-toha": "blueDoor",
  // 季節のこと
  "satsumaimo-shun-itsu": "cakeSweetPotato",
  "satsumaimo-hinshu-chigai": "showcase01",
  "matcha-kuchikiri": "cakeMatcha",
  "fuyu-cafe-sugoshikata": "interior02",
  "yukimichi-cafe-kuruma": "parkingSign",
  "valentine-gateau-chocolat": "cakeGateau",
  "ichigo-shun-itsu": "cakeGateau",
  "white-day-okaeshi-cake": "cakeChocolatBerry",
  "hanami-kaeri-cafe": "interior03",
  "haha-no-hi-cafe-lunch": "plateOmurice",
  "shincha-matcha-jiki": "cakeMatcha",
  "tsuyu-ame-cafe": "interior01",
  "chichi-no-hi-cafe": "plateRoastBeef",
  "blueberry-shun-itsu": "cakeGateau",
  "natsu-tsumetai-dessert": "cakeTiramisu",
  "obon-kisei-cafe": "exterior",
  "keiro-no-hi-cafe": "plateHamburg",
  "nenmatsu-nenshi-eigyo-shirabekata": "entranceSign",
  // 店のこと
  "mizuiro-no-tobira-mejirushi": "parkingSign",
  "refaire-imi-france-go": "signboard",
  "olive-hachiue-genkan": "oliveTree",
  "one-line-art-toha": "wallArt",
};

/** 見出し写真を選ぶ。決めてある題材はその写真、無ければ種類の合う写真から（直近の記事と重ならないもの） */
export function pickEyecatch(topic: Topic, posts: Post[]): PhotoKey {
  const pinned = TOPIC_PHOTO[topic.id];
  if (pinned && photoMeta[pinned]?.og) return pinned;

  const candidates = photoKeys.filter((k) => photoMeta[k].og && topic.photoKinds.includes(photoMeta[k].kind));
  const pool = candidates.length ? candidates : photoKeys.filter((k) => photoMeta[k].og);
  const recent = new Set(posts.slice(0, 6).map((p) => p.eyecatch));
  const fresh = pool.filter((k) => !recent.has(k));
  const from = fresh.length ? fresh : pool;
  return from[hash(topic.id) % from.length];
}

// ---------------------------------------------------------------------------
// 本文からリンクする、ほかの記事の候補
// ---------------------------------------------------------------------------
export function relatedCandidates(topic: Topic, posts: Post[], count = 6): Post[] {
  const words = new Set(keywordKey(topic.focusKeyword).split(" "));
  return posts
    .filter((p) => p.category !== "news" && p.slug !== topic.id)
    .map((p) => {
      let score = 0;
      if (p.category === topic.category) score += 3;
      if (p.relatedPages[0] === topic.pillar) score += 1;
      score += Math.min(2, keywordKey(p.focusKeyword).split(" ").filter((w) => words.has(w)).length);
      return { p, score };
    })
    .sort((a, b) => b.score - a.score || (a.p.publishedAt < b.p.publishedAt ? 1 : -1))
    .slice(0, count)
    .map((x) => x.p);
}
