/** 文章の比較と整形に使う小さな道具（サイトと自動投稿の両方から使う） */

/** 記号・空白を落として、全角英数を半角にそろえる（比べやすくするため） */
export function normalize(s: string): string {
  return s
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[\s　、。，．・「」『』（）()［］\[\]【】〈〉《》!！?？:：;；'"“”‘’〜~ー\-‐–—_/\\|｜#＃*＊]/g, "");
}

/** 検索語を比べるための鍵（語の順番が違っても同じとみなす） */
export function keywordKey(keyword: string): string {
  return keyword
    .normalize("NFKC")
    .toLowerCase()
    .split(/[\s　]+/)
    .filter(Boolean)
    .sort()
    .join(" ");
}

function bigrams(s: string): Map<string, number> {
  const m = new Map<string, number>();
  for (let i = 0; i < s.length - 1; i++) {
    const g = s.slice(i, i + 2);
    m.set(g, (m.get(g) ?? 0) + 1);
  }
  return m;
}

/**
 * 2文字単位の Dice 係数（0〜1）。題名や検索語のような短い文に使う。
 * 本文には使わない（同じ分野の日本語は、別の記事でも 0.5 近くまで上がってしまう）。
 */
export function dice(a: string, b: string): number {
  const x = bigrams(normalize(a));
  const y = bigrams(normalize(b));
  let hit = 0;
  let total = 0;
  for (const [g, n] of x) {
    total += n;
    hit += Math.min(n, y.get(g) ?? 0);
  }
  for (const n of y.values()) total += n;
  return total === 0 ? 0 : (2 * hit) / total;
}

function shingles(s: string, k: number): Set<string> {
  const out = new Set<string>();
  for (let i = 0; i <= s.length - k; i++) out.add(s.slice(i, i + k));
  return out;
}

/**
 * 8文字の連なりが、どれだけ重なっているか（0〜1）。本文の「焼き直し・写し」を見つけるために使う。
 * 別の記事どうしなら 0.15 ほどまでに収まる。0.2 を超えたら、同じ文章の言い換えを疑う。
 */
export function shingleOverlap(a: string, b: string, k = 8): number {
  const x = shingles(a, k);
  const y = shingles(b, k);
  if (x.size === 0 || y.size === 0) return 0;
  let hit = 0;
  for (const g of x) if (y.has(g)) hit++;
  return hit / Math.min(x.size, y.size);
}

/** 文に分ける（。！？と改行で区切る） */
export function sentences(text: string): string[] {
  return text
    .split(/(?<=[。！？!?])|\n+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/** 文字列から決まった数を作る（題材ごとに、いつも同じ写真・同じ型を選ぶため） */
export function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Markdown の記法を落として、文字だけにする（文字数を数える・比べるため） */
export function plainText(markdown: string): string {
  return markdown
    .replace(/```[\s\S]*?```/g, "")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^\s*>\s?/gm, "")
    .replace(/^\s*[-*+]\s+/gm, "")
    .replace(/^\s*\d+\.\s+/gm, "")
    .replace(/\|/g, "")
    .replace(/^[-:\s]+$/gm, "")
    .replace(/[*_`~]/g, "")
    .replace(/\s+/g, "");
}

/** 本文の h2 を拾う（目次と、構成の焼き直し検査に使う） */
export function h2List(markdown: string): string[] {
  return [...markdown.matchAll(/^##\s+(.+?)\s*$/gm)].map((m) => m[1].replace(/[*_`]/g, "").trim());
}

/** 本文中のリンク（内部・外部とも） */
export function linkTargets(markdown: string): { text: string; href: string }[] {
  return [...markdown.matchAll(/\[([^\]]+)\]\(([^)\s]+)\)/g)].map((m) => ({ text: m[1], href: m[2] }));
}

/** 全角の数字を半角にする */
export function normalizeDigits(s: string): string {
  return s.replace(/[０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0)).replace(/[：]/g, ":").replace(/[，]/g, ",");
}
