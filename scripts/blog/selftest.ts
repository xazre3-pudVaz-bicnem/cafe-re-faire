/**
 * 自動投稿の仕組みの自己点検。
 *   npm run blog:selftest
 *
 * API を呼ばずに、次を確かめる。
 *   1. 題材の台帳に不備が無いか（検索語の重なり・固定ページとの取り合い・写真の指定）
 *   2. 検査（lib/blog/validate.ts）が、決まりに合わない原稿をちゃんと落とすか
 *   3. よい原稿（fixtures/good.json）が、最後まで通るか
 *   4. 同じ日に2回動いても、同じ題材・同じファイル名になるか
 */
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { topicById, topics } from "../../data/blog-topics";
import { linkablePaths, reservedKeywords } from "../../data/pages";
import { photoMeta } from "../../data/photo-meta";
import { loadPosts, parsePostSource, postFilePath, SLUG_PATTERN, type Post } from "../../lib/blog/core";
import { DraftSchema, runPipeline, type Ask } from "../../lib/blog/pipeline";
import { AUTO_CATEGORIES, checkProposedTopic, selectTopics, TOPIC_PHOTO } from "../../lib/blog/select";
import { dice, keywordKey, plainText } from "../../lib/blog/text";
import { validateArticle, type Draft, type Target } from "../../lib/blog/validate";

let failures = 0;
const ok = (name: string) => console.log(`  ✓ ${name}`);
const ng = (name: string, detail: string) => {
  failures++;
  console.log(`  ✗ ${name}\n      ${detail}`);
};

const fixture = (name: string): Draft =>
  DraftSchema.parse(JSON.parse(fs.readFileSync(path.join(process.cwd(), "scripts", "blog", "fixtures", name), "utf8")));

// ---------------------------------------------------------------------------
console.log("1. 題材の台帳");
{
  const ids = new Set<string>();
  const keys = new Map<string, string>();
  const reserved = new Set(reservedKeywords.map(keywordKey));
  const problems: string[] = [];
  for (const t of topics) {
    if (!SLUG_PATTERN.test(t.id)) problems.push(`${t.id}: id の形が違う`);
    if (ids.has(t.id)) problems.push(`${t.id}: id が重なっている`);
    ids.add(t.id);
    const key = keywordKey(t.focusKeyword);
    if (keys.has(key)) problems.push(`${t.id}: 検索語が ${keys.get(key)} と同じ（${t.focusKeyword}）`);
    keys.set(key, t.id);
    if (reserved.has(key)) problems.push(`${t.id}: 固定ページが受け持つ検索語と同じ（${t.focusKeyword}）`);
    if (!AUTO_CATEGORIES.includes(t.category)) problems.push(`${t.id}: 自動投稿できない分類（${t.category}）`);
    if (!linkablePaths.includes(t.pillar)) problems.push(`${t.id}: pillar が固定ページに無い（${t.pillar}）`);
    if (t.months?.some((m) => m < 1 || m > 12)) problems.push(`${t.id}: months は 1〜12`);
    const photo = TOPIC_PHOTO[t.id];
    if (!photo) problems.push(`${t.id}: 見出し写真が決まっていない（lib/blog/select.ts の TOPIC_PHOTO）`);
    else if (!photoMeta[photo]?.og) problems.push(`${t.id}: 見出し写真 ${photo} に SNS 用の画像が無い`);
    if (t.category === "mizusawa" && !t.facts?.length) problems.push(`${t.id}: 「水沢・奥州のこと」の題材には facts が要る`);
  }
  // 検索語が近すぎる題材（同じ疑問を2回書くことになる）
  for (let i = 0; i < topics.length; i++) {
    for (let j = i + 1; j < topics.length; j++) {
      const d = dice(topics[i].focusKeyword, topics[j].focusKeyword);
      if (d > 0.8) problems.push(`${topics[i].id} と ${topics[j].id}: 検索語が近い（${d.toFixed(2)}）`);
    }
  }
  for (const id of Object.keys(TOPIC_PHOTO)) if (!ids.has(id)) problems.push(`TOPIC_PHOTO に、台帳に無い題材がある: ${id}`);
  if (problems.length) ng(`題材 ${topics.length} 本`, problems.join("\n      "));
  else ok(`題材 ${topics.length} 本（${AUTO_CATEGORIES.map((c) => `${c} ${topics.filter((t) => t.category === c).length}`).join("／")}）`);
}

// ---------------------------------------------------------------------------
console.log("2. 検査が、決まりに合わない原稿を落とすか");
const posts = loadPosts();
const good = fixture("good.json");
const target: Target = {
  slug: "tiramisu-imi",
  category: "menu",
  focusKeyword: "ティラミス 意味",
  pillar: "/menu",
};
const TODAY = "2026-10-08";
const others = posts.filter((p) => p.slug !== target.slug);

{
  const problems = validateArticle(good, target, others, TODAY);
  if (problems.length) ng("よい原稿（fixtures/good.json）が通る", problems.map((p) => `[${p.code}] ${p.message}`).join("\n      "));
  else ok("よい原稿（fixtures/good.json）が通る");
}

/** よい原稿に、1か所だけ違反を足す。期待した種類の指摘が出れば合格 */
const shopLine = "Cafe Re faireのショーケースには、ティラミスムースがあります。";
const cases: { name: string; code: string; change: (d: Draft) => Draft }[] = [
  { name: "事実シートに無い金額", code: "price", change: (d) => ({ ...d, body: d.body.replace(shopLine, `${shopLine}飲みものは400円からです。`) }) },
  { name: "店の段落に、事実シートに無い数値（席数）", code: "fact.unverified", change: (d) => ({ ...d, body: d.body.replace(shopLine, `${shopLine}Cafe Re faireの席は20席です。`) }) },
  { name: "店の段落に、違う営業時間", code: "fact.number", change: (d) => ({ ...d, body: d.body.replace(shopLine, `${shopLine}Cafe Re faireは、朝8時に開きます。`) }) },
  { name: "店の段落に、違う駐車台数", code: "fact.number", change: (d) => ({ ...d, body: d.body.replace(shopLine, `${shopLine}Cafe Re faireの駐車場は10台です。`) }) },
  { name: "メニューに無い品（カフェラテ）", code: "fact.unverified", change: (d) => ({ ...d, body: d.body.replace(shopLine, `${shopLine}Cafe Re faireのカフェラテとよく合います。`) }) },
  { name: "作り方の決めつけ（手作り）", code: "fact.unverified", change: (d) => ({ ...d, body: d.body.replace(shopLine, `${shopLine}Cafe Re faireのケーキは、すべて手作りです。`) }) },
  { name: "店の人の作り話（店主）", code: "fact.unverified", change: (d) => ({ ...d, body: d.body.replace(shopLine, `${shopLine}Cafe Re faireの店主が、毎日焼いています。`) }) },
  { name: "限定メニューの作り話", code: "fact.unverified", change: (d) => ({ ...d, body: d.body.replace(shopLine, `${shopLine}Cafe Re faireでは、秋限定のケーキも出しています。`) }) },
  { name: "イベントの作り話", code: "fact.unverified", change: (d) => ({ ...d, body: d.body.replace(shopLine, `${shopLine}Cafe Re faireでは、月に一度ワークショップを開いています。`) }) },
  { name: "店の人気の決めつけ", code: "fact.popular", change: (d) => ({ ...d, body: d.body.replace(shopLine, `${shopLine}Cafe Re faireでも人気のケーキです。`) }) },
  { name: "雰囲気の決めつけ（隠れ家）", code: "fact.unverified", change: (d) => ({ ...d, body: d.body.replace(shopLine, `${shopLine}Cafe Re faireは、隠れ家のような店です。`) }) },
  { name: "口コミ", code: "unsupported", change: (d) => ({ ...d, body: `${d.body}\n\n口コミでも評価の高い菓子です。` }) },
  { name: "最上級（絶品）", code: "unsupported", change: (d) => ({ ...d, body: `${d.body}\n\n絶品のティラミスです。` }) },
  { name: "ほかの店の名前", code: "unsupported", change: (d) => ({ ...d, body: `${d.body}\n\nスターバックスにも似た菓子があります。` }) },
  { name: "ほかの店との比較", code: "unsupported", change: (d) => ({ ...d, body: `${d.body}\n\nほかの店のものより、ずっと軽い口あたりです。` }) },
  { name: "健康への効果", code: "unsupported", change: (d) => ({ ...d, body: `${d.body}\n\nココアにはリラックス効果があります。` }) },
  { name: "確かめていない年", code: "year", change: (d) => ({ ...d, body: `${d.body}\n\nティラミスは1960年に生まれました。` }) },
  { name: "確かめていない割合", code: "stat", change: (d) => ({ ...d, body: `${d.body}\n\n日本人の8割が好きな菓子です。` }) },
  { name: "確かめていない世紀", code: "stat", change: (d) => ({ ...d, body: `${d.body}\n\n17世紀の宮廷で好まれました。` }) },
  { name: "確かめていない施設名", code: "proper.place", change: (d) => ({ ...d, body: `${d.body}\n\n食べたあとは、駒形神社まで歩くのもよいでしょう。` }) },
  { name: "確かめていない人名", code: "proper.person", change: (d) => ({ ...d, body: `${d.body}\n\n考案したのは田中太郎さんです。` }) },
  { name: "実在の人物", code: "proper.person", change: (d) => ({ ...d, body: `${d.body}\n\n地元出身の野球選手も好物だそうです。` }) },
  { name: "感嘆符", code: "stock", change: (d) => ({ ...d, body: d.body.replace("。", "！") }) },
  { name: "絵文字", code: "stock", change: (d) => ({ ...d, body: `${d.body}\n\nおいしい菓子です☕` }) },
  { name: "定型表現（いかがでしたか）", code: "stock", change: (d) => ({ ...d, body: `${d.body}\n\nいかがでしたか。` }) },
  { name: "定型表現（ご紹介します）", code: "stock", change: (d) => ({ ...d, body: `ティラミスの意味をご紹介します。\n\n${d.body}` }) },
  { name: "定型表現（ぜひ〜）", code: "stock", change: (d) => ({ ...d, body: `${d.body}\n\nぜひ一度、足を運んでみてください。` }) },
  { name: "決まり文句（こだわりの）", code: "stock", change: (d) => ({ ...d, body: `${d.body}\n\nこだわりの一皿です。` }) },
  { name: "「当店」", code: "stock", change: (d) => ({ ...d, body: `${d.body}\n\n当店でも用意しています。` }) },
  { name: "見出し「まとめ」", code: "heading.stock", change: (d) => ({ ...d, body: `${d.body}\n\n## まとめ\n\nティラミスの意味を見てきました。` }) },
  { name: "本文の h1", code: "h1", change: (d) => ({ ...d, body: `# ティラミス\n\n${d.body}` }) },
  { name: "本文の画像", code: "image", change: (d) => ({ ...d, body: `${d.body}\n\n![ティラミス](/images/tiramisu-mousse.jpg)` }) },
  { name: "サイト外へのリンク", code: "link.external", change: (d) => ({ ...d, body: `${d.body}\n\n[参考](https://example.com/)` }) },
  { name: "存在しないページへのリンク", code: "link.missing", change: (d) => ({ ...d, body: `${d.body}\n\n[予約のページ](/reservation)` }) },
  { name: "存在しない記事へのリンク", code: "link.missing", change: (d) => ({ ...d, body: `${d.body}\n\n[別の記事](/blog/no-such-post)` }) },
  { name: "リンクの文言「こちら」", code: "link.label", change: (d) => ({ ...d, body: d.body.replace(/\[[^\]]+\]\(\/menu\)/, "[こちら](/menu)") }) },
  { name: "いちばん関係の深いページへのリンクが無い", code: "link.pillar", change: (d) => ({ ...d, body: d.body.replace(/\[([^\]]+)\]\(\/menu\)/g, "$1") }) },
  { name: "題名の型（おすすめカフェ）", code: "title.banned", change: (d) => ({ ...d, title: "水沢のおすすめカフェで食べたいティラミスの意味" }) },
  { name: "題名の型（◯選）", code: "stock", change: (d) => ({ ...d, title: "ティラミスの意味と、知っておきたい豆知識5選" }) },
  { name: "題名が短すぎる", code: "length.title", change: (d) => ({ ...d, title: "ティラミスの意味" }) },
  { name: "説明文が長すぎる", code: "length.description", change: (d) => ({ ...d, description: d.description.repeat(3) }) },
  { name: "本文が短すぎる", code: "length.body", change: (d) => ({ ...d, body: d.body.slice(0, 700) }) },
  { name: "検索語が題名と説明文に無い", code: "keyword.head", change: (d) => ({ ...d, title: "イタリア生まれの、あの菓子の名前について考える", description: "イタリアで生まれた菓子の名前には、どんな由来があるのでしょうか。ことばの成り立ちと、いまの日本での食べられ方を、順に書きました。菓子の名前を知ると、味わい方も変わります。" }) },
  { name: "「水沢のカフェ」の連呼", code: "keyword.stuffing", change: (d) => ({ ...d, body: `${d.body}\n\n${"水沢のカフェで食べる。".repeat(6)}` }) },
  { name: "店名に触れていない", code: "shop.none", change: (d) => ({ ...d, description: d.description.replace(/Cafe Re faire/g, "店"), body: d.body.replace(/Cafe Re faire/g, "その店") }) },
  { name: "既存の記事と同じ題名", code: "dup.title", change: (d) => ({ ...d, title: posts.find((p) => p.category !== "news")?.title ?? d.title }) },
  // 店の紹介を、記事の最後に付け足す形
  { name: "最後の見出しに店名", code: "heading.shop-last", change: (d) => ({ ...d, body: `${d.body}\n\n## Cafe Re faireのティラミスムース\n\nケーキは皿に盛って出されます。` }) },
  { name: "店名の入った見出しが2つ", code: "heading.shop-many", change: (d) => ({ ...d, body: d.body.replace("## 何でできている菓子か", "## Cafe Re faireで見る材料").replace("## ムースにすると、何が変わるか", "## Cafe Re faireのムース") }) },
  { name: "最後の節が、店の話で終わる", code: "shop.tail", change: (d) => ({ ...d, body: `${d.body}\n\nCafe Re faireは、朝9時に開きます。Cafe Re faireには、店舗前に5台の駐車場があります。` }) },
  { name: "「同店」という言い方", code: "shop.implicit", change: (d) => ({ ...d, body: d.body.replace(shopLine, `${shopLine}同店では、皿に盛って出します。`) }) },
  { name: "「このカフェ」という言い方", code: "shop.implicit", change: (d) => ({ ...d, body: `${d.body}\n\nこのカフェのケーキは、6種類あります。` }) },
  // リンクを1か所に固める
  { name: "1つの段落にリンクが3本", code: "link.cluster", change: (d) => ({ ...d, body: `${d.body}\n\n写真は[ケーキのメニュー](/menu)に、地図は[アクセスのページ](/access)に、店のことは[Cafe Re faireについて](/about)にあります。` }) },
  // 表
  { name: "4列の表", code: "table.wide", change: (d) => ({ ...d, body: `${d.body}\n\n| 比べる点 | A | B | C |\n| --- | --- | --- | --- |\n| 味 | 甘い | 苦い | 軽い |` }) },
  { name: "表の見出しの行に、空のマス", code: "table.header", change: (d) => ({ ...d, body: `${d.body}\n\n| | ティラミス | ムース |\n| --- | --- | --- |\n| 口あたり | やわらかい | 軽い |` }) },
];

for (const c of cases) {
  const problems = validateArticle(c.change(good), target, others, TODAY);
  if (problems.some((p) => p.code === c.code)) ok(c.name);
  else ng(c.name, `[${c.code}] が出るはずが、出たのは: ${problems.map((p) => p.code).join(", ") || "（なし）"}`);
}

{
  // 既存の記事の写し（本文の重なり）
  const sample = posts.find((p) => p.category !== "news" && p.slug !== target.slug);
  if (sample) {
    const problems = validateArticle({ ...good, body: sample.body }, target, others, TODAY);
    if (problems.some((p) => p.code === "dup.body")) ok("既存の記事の写し（本文の重なり）");
    else ng("既存の記事の写し（本文の重なり）", "dup.body が出ない");
  }
  // 既存の記事と同じ検索語
  const taken = posts.find((p) => p.focusKeyword);
  if (taken) {
    const problems = validateArticle(good, { ...target, focusKeyword: taken.focusKeyword }, others, TODAY);
    if (problems.some((p) => p.code === "cannibal.post")) ok("既存の記事と同じ検索語");
    else ng("既存の記事と同じ検索語", "cannibal.post が出ない");
  }
  // 固定ページが受け持つ検索語
  const problems = validateArticle(good, { ...target, focusKeyword: "水沢 カフェ" }, others, TODAY);
  if (problems.some((p) => p.code === "cannibal.page")) ok("固定ページが受け持つ検索語（水沢 カフェ）");
  else ng("固定ページが受け持つ検索語（水沢 カフェ）", "cannibal.page が出ない");
}

// ---------------------------------------------------------------------------
console.log("2b. 手書きの原稿（content/drafts）");
{
  // 公開前の原稿も、公開したときに検査を通る状態にしておく。原稿のある題材は、自動投稿が書かない（hold）
  const dir = path.join(process.cwd(), "content", "drafts");
  const files = fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => f.endsWith(".md")) : [];
  const held = topics.filter((t) => t.hold).map((t) => t.id);
  for (const file of files) {
    const fm = matter(fs.readFileSync(path.join(dir, file), "utf8"));
    const d = fm.data as Record<string, unknown>;
    const slug = file.replace(/\.md$/, "");
    const topic = topicById(slug);
    const problems = validateArticle(
      { title: String(d.title ?? ""), description: String(d.description ?? ""), body: fm.content.trim(), keywords: (d.keywords as string[]) ?? [] },
      {
        slug,
        category: String(d.category ?? ""),
        focusKeyword: String(d.focusKeyword ?? ""),
        pillar: ((d.relatedPages as string[]) ?? ["/"])[0],
        facts: topic?.facts,
      },
      posts,
      TODAY,
    );
    if (d.slug !== slug) problems.push({ code: "slug", message: `frontmatter の slug（${d.slug}）がファイル名と違う` });
    if (!topic?.hold) problems.push({ code: "hold", message: "data/blog-topics.ts の同じ id の題材に hold: true が無い（自動投稿が同じ題材を書いてしまう）" });
    if (problems.length) ng(`原稿 ${file}`, problems.map((p) => `[${p.code}] ${p.message}`).join("\n      "));
    else ok(`原稿 ${file}（${plainText(fm.content).length}字）`);
  }
  for (const id of held) {
    if (!files.includes(`${id}.md`) && !posts.some((p) => p.slug === id)) ng(`題材 ${id}`, "hold: true なのに、原稿（content/drafts）も公開済みの記事も無い。印を外すか、原稿を置く");
  }
  if (selectTopics(posts, TODAY).some((t) => t.hold) || selectTopics(posts, "2026-11-15").some((t) => t.hold)) ng("hold", "原稿のある題材が、自動投稿の候補に入っている");
  else ok(`原稿のある題材（${held.length} 本）は、自動投稿の候補に入らない`);
}

// ---------------------------------------------------------------------------
console.log("3. 題材の提案の検査");
{
  const base = { id: "cake-hozon-houhou", category: "menu", focusKeyword: "ケーキ 保存 方法", angle: "買ってきたケーキを、家でどう置いておけばよいかを説明する。", pillar: "/menu", photoKind: "cake" };
  const good1 = checkProposedTopic(base, posts);
  if (good1.topic) ok("よい提案が通る");
  else ng("よい提案が通る", good1.errors.join(" / "));

  const bad: [string, Partial<typeof base>][] = [
    ["固定ページの検索語", { focusKeyword: "水沢 カフェ" }],
    ["台帳にある検索語", { focusKeyword: topics[0].focusKeyword }],
    ["評価を前提にした題材", { focusKeyword: "水沢 カフェ おすすめ 人気" }],
    ["確かめられていない設備", { focusKeyword: "カフェ Wi-Fi 電源" }],
    ["提案できない分類（水沢）", { category: "mizusawa" }],
    ["存在しない固定ページ", { pillar: "/reservation" }],
    ["id の形", { id: "ケーキ" }],
    ["台帳にある id", { id: topics[0].id }],
  ];
  for (const [name, patch] of bad) {
    const r = checkProposedTopic({ ...base, ...patch }, posts);
    if (r.topic) ng(`不採用: ${name}`, "通ってしまった");
    else ok(`不採用: ${name}`);
  }
}

// ---------------------------------------------------------------------------
console.log("4. 流れ（題材選び → 検査 → 保存する形）");
async function flow() {
  const askGood: Ask = (async (schema) => schema.parse(good)) as Ask;
  const args = { posts, date: TODAY, model: "fixture", ask: askGood, topicId: "tiramisu-imi" };
  const result = await runPipeline(args);
  if (result.status !== "published") {
    ng("よい原稿が、保存する形になる", result.status === "failed" ? `${result.reason} ${result.problems.map((p) => p.code).join(", ")}` : result.status);
    return;
  }
  ok(`よい原稿が、保存する形になる（${result.path}／${result.chars}字）`);

  const parsed = parsePostSource(result.path, result.markdown);
  if (parsed.post && parsed.post.slug === "tiramisu-imi" && parsed.post.author === "auto" && parsed.post.eyecatch === TOPIC_PHOTO["tiramisu-imi"]) {
    ok("保存した Markdown を、サイトが読める");
  } else ng("保存した Markdown を、サイトが読める", parsed.error ?? "内容が違う");

  if (result.path === postFilePath(TODAY, "tiramisu-imi")) ok("ファイル名が、日付と題材から決まる");
  else ng("ファイル名が、日付と題材から決まる", result.path);

  // 今日の分があれば、何もしない
  const withToday: Post[] = [parsed.post!, ...posts];
  const again = await runPipeline({ ...args, posts: withToday, topicId: undefined });
  if (again.status === "skipped") ok("今日の分があれば、何もしない");
  else ng("今日の分があれば、何もしない", again.status);

  // 同じ日なら、同じ題材が選ばれる
  const a = selectTopics(posts, TODAY)[0]?.id;
  const b = selectTopics(posts, TODAY)[0]?.id;
  if (a && a === b) ok(`同じ日なら、同じ題材が選ばれる（${a}）`);
  else ng("同じ日なら、同じ題材が選ばれる", `${a} / ${b}`);

  // 書いた題材は、次の日には選ばれない
  const next = selectTopics(withToday, "2026-10-09").map((t) => t.id);
  if (!next.includes("tiramisu-imi")) ok("書いた題材は、もう選ばれない");
  else ng("書いた題材は、もう選ばれない", "tiramisu-imi が候補に残っている");

  // 直前の記事と、別の分類が選ばれる
  const firstCat = selectTopics(withToday, "2026-10-09")[0]?.category;
  if (firstCat && firstCat !== "menu") ok(`直前の記事（menu）と別の分類が選ばれる（${firstCat}）`);
  else ng("直前の記事と別の分類が選ばれる", String(firstCat));

  // 決まりに合わない原稿しか出てこなければ、公開しない
  const askBad: Ask = (async (schema) => schema.parse({ ...good, body: `${good.body}\n\n絶品です。` })) as Ask;
  const rejected = await runPipeline({ ...args, ask: askBad });
  if (rejected.status === "failed") ok("検査を通らない原稿は、公開しない");
  else ng("検査を通らない原稿は、公開しない", rejected.status);

  // 1回目が不合格でも、直した原稿が通れば公開する
  let n = 0;
  const askFix: Ask = (async (schema) => schema.parse(n++ === 0 ? { ...good, body: `${good.body}\n\n絶品です。` } : good)) as Ask;
  const fixed = await runPipeline({ ...args, ask: askFix });
  if (fixed.status === "published" && fixed.attempts === 2) ok("指摘を受けて直した原稿は、公開する（2回目で合格）");
  else ng("指摘を受けて直した原稿は、公開する", fixed.status);
}

flow()
  .catch((e) => ng("流れ", (e as Error).stack ?? String(e)))
  .finally(() => {
    console.log(failures ? `\n失敗が ${failures} 件あります。` : "\nすべて通りました。");
    if (failures) process.exit(1);
  });
