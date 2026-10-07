/**
 * SEO の決まりの点検（ソースを読むだけ。サーバーは要らない）。
 *   npm run seo:audit
 *
 * 1. 固定ページの台帳（data/pages.ts）… title・description の長さ、検索語の重なり
 * 2. 店舗情報の一元管理 … 住所・電話・営業時間・価格を、ページやコンポーネントに直接書いていないか
 *    （値は data/site.ts・data/menu.ts から出す。直接書くと、片方だけ直し忘れて表記がずれる）
 * 3. 写真 … 登録した写真のファイルがあるか、alt が空でないか
 */
import fs from "node:fs";
import path from "node:path";
import { cakes } from "../data/menu";
import { pageList, reservedKeywords } from "../data/pages";
import { photoKeys, photoMeta } from "../data/photo-meta";
import { site } from "../data/site";
import { keywordKey } from "../lib/blog/text";

let failures = 0;
const ok = (s: string) => console.log(`  ✓ ${s}`);
const ng = (s: string) => {
  failures++;
  console.log(`  ✗ ${s}`);
};
const len = (s: string) => [...s].length;

// ---------------------------------------------------------------------------
console.log("1. 固定ページの台帳");
{
  const titles = new Set<string>();
  const keys = new Map<string, string>();
  for (const p of pageList) {
    const t = len(p.title);
    const d = len(p.description);
    if (t < 15 || t > 40) ng(`${p.path}: title は 15〜40字（いま ${t}字）「${p.title}」`);
    if (d < 70 || d > 120) ng(`${p.path}: description は 70〜120字（いま ${d}字）`);
    if (titles.has(p.title)) ng(`${p.path}: title がほかのページと同じ`);
    titles.add(p.title);
    for (const k of [p.primaryKeyword, ...p.secondaryKeywords]) {
      const key = keywordKey(k);
      if (keys.has(key)) ng(`${p.path}: 検索語「${k}」が ${keys.get(key)} と重なっている`);
      keys.set(key, p.path);
    }
    // 受け持つ検索語のことばが、title か description に入っているか
    const head = `${p.title} ${p.description}`;
    const missing = p.primaryKeyword.split(/\s+/).filter((w) => !head.includes(w));
    if (missing.length) ng(`${p.path}: 検索語「${p.primaryKeyword}」のうち、title・description に無い語: ${missing.join("、")}`);
  }
  if (!failures) ok(`${pageList.length} ページ／受け持つ検索語 ${reservedKeywords.length} 個（重なりなし）`);
  for (const p of pageList) console.log(`      ${p.path.padEnd(8)} title ${String(len(p.title)).padStart(2)}字／description ${String(len(p.description)).padStart(3)}字／${p.primaryKeyword}`);
}

// ---------------------------------------------------------------------------
console.log("2. 店舗情報を、ページに直接書いていないか");
{
  const before = failures;
  const roots = ["app", "components"];
  const files: string[] = [];
  const walk = (dir: string) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) walk(full);
      else if (/\.(tsx?|css)$/.test(e.name)) files.push(full);
    }
  };
  for (const r of roots) walk(path.join(process.cwd(), r));

  const { weekday, sundayHoliday } = site.hours;
  const forbidden: [RegExp, string][] = [
    [new RegExp(site.address.street.replace(/[-]/g, "[-ー－]")), "住所（番地）"],
    [new RegExp(site.address.postalCode.replace("-", "-?")), "郵便番号"],
    ...(site.phone ? [[new RegExp(site.phone.display.replace(/-/g, "[-ー－ ]?")), "電話番号"] as [RegExp, string]] : []),
    [new RegExp(`${weekday.lastOrder}|${sundayHoliday.lastOrder}|${sundayHoliday.closes}|${weekday.closes}`), "営業時間"],
    [new RegExp(`${cakes[0].price}\\s*円|${site.takeout.regularPrice.yen}\\s*円`), "価格"],
    [/水曜(日)?(定休|休み)|定休日は水曜/, "定休日"],
  ];
  for (const file of files) {
    const rel = path.relative(process.cwd(), file).replace(/\\/g, "/");
    const lines = fs.readFileSync(file, "utf8").split(/\r?\n/);
    lines.forEach((line, i) => {
      // コメントの中の例示は対象にしない
      if (/^\s*(\/\/|\*|\/\*)/.test(line)) return;
      for (const [re, label] of forbidden) {
        if (re.test(line)) ng(`${rel}:${i + 1} に ${label} を直接書いている: ${line.trim().slice(0, 70)}`);
      }
    });
  }
  if (failures === before) ok(`${files.length} ファイルを調べました（住所・電話・営業時間・価格・定休日の直接の記述なし）`);
}

// ---------------------------------------------------------------------------
console.log("3. 写真");
{
  const before = failures;
  for (const key of photoKeys) {
    const m = photoMeta[key];
    const file = path.join(process.cwd(), "public", "images", `${m.file}.jpg`);
    if (!fs.existsSync(file)) ng(`${key}: 写真がありません（public/images/${m.file}.jpg）。npm run images:prepare を実行してください`);
    if (m.og && !fs.existsSync(path.join(process.cwd(), "public", "og", `${m.file}.jpg`))) ng(`${key}: SNS 用の画像がありません（public/og/${m.file}.jpg）`);
    if (len(m.alt) < 10) ng(`${key}: alt が短すぎます（写っているものを書く）`);
    if (/水沢\s?カフェ|おすすめ|人気/.test(m.alt)) ng(`${key}: alt に検索語を詰め込まない`);
  }
  if (failures === before) ok(`写真 ${photoKeys.length} 枚（ファイルあり・alt あり）`);
}

console.log(failures ? `\n問題が ${failures} 件あります。` : "\n問題はありません。");
if (failures) process.exit(1);
