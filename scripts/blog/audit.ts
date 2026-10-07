/**
 * 公開している記事の点検。
 *   npm run blog:audit
 *
 * content/blog/ のすべての記事を、自動投稿と同じ検査（lib/blog/validate.ts）に通す。
 * 手で書いた記事・直した記事が、決まり（店の事実・重複・リンク切れ）から外れていないかを確かめる。
 * 1件でも問題があれば、終了コード 1 で終わる（npm run check の一部）。
 */
import fs from "node:fs";
import path from "node:path";
import { topicById } from "../../data/blog-topics";
import { BLOG_DIR, loadPosts, parsePostSource } from "../../lib/blog/core";
import { validateArticle } from "../../lib/blog/validate";

function allFiles(dir: string, base = "content/blog"): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    if (e.isDirectory()) return allFiles(path.join(dir, e.name), `${base}/${e.name}`);
    return e.name.endsWith(".md") && !e.name.startsWith("_") ? [`${base}/${e.name}`] : [];
  });
}

const posts = loadPosts();
let failed = 0;

// 読めない記事（frontmatter の不備など）は、サイトでは読み飛ばされる。ここで知らせる
for (const file of allFiles(BLOG_DIR)) {
  const { error } = parsePostSource(file, fs.readFileSync(path.join(process.cwd(), ...file.split("/")), "utf8"));
  if (error) {
    failed++;
    console.log(`✗ ${file}\n    - 読めません: ${error}`);
  }
}

for (const post of posts) {
  const topic = post.topicId ? topicById(post.topicId) : topicById(post.slug);
  const problems = validateArticle(
    { title: post.title, description: post.description, body: post.body, keywords: post.keywords },
    {
      slug: post.slug,
      category: post.category,
      focusKeyword: post.focusKeyword,
      pillar: post.relatedPages[0] ?? "/",
      facts: topic?.facts,
      kind: post.category === "news" ? "news" : "article",
    },
    posts.filter((p) => p.slug !== post.slug),
    post.publishedAt,
  );
  if (problems.length) {
    failed++;
    console.log(`✗ ${post.file}（${post.chars}字）`);
    for (const p of problems) console.log(`    - [${p.code}] ${p.message}`);
  } else {
    console.log(`✓ ${post.slug}（${post.chars}字／${post.category}）`);
  }
}

console.log(`\n記事 ${posts.length} 本を点検しました。${failed ? `問題のある記事が ${failed} 本あります。` : "問題はありません。"}`);
if (failed) process.exit(1);
