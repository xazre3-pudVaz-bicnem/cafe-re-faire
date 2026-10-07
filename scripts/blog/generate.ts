/**
 * 記事を1本、手元で書く（毎日の自動投稿と同じ流れを、手元で動かすためのもの）。
 *
 *   npm run blog:dry-run     … 書いて検査するが、保存しない（原稿を表示する）
 *   npm run blog:generate    … 書いて、content/blog/ に保存する（コミットは自分で行う）
 *
 * 本番の毎日の投稿は、Vercel Cron → /api/cron/daily-post が行う。これは、試し書きと、手で1本足したいとき用。
 *
 * 環境変数
 *   ANTHROPIC_API_KEY  必須（.env.local に置く。リポジトリには絶対に入れない）
 *   ANTHROPIC_MODEL    使うモデル。省くと claude-haiku-4-5
 *   DRY_RUN=1          保存しない
 *   DRY_RUN_FIXTURE    原稿の JSON ファイル。API を呼ばず、その内容を「モデルの出力」として検査する
 *   BLOG_TOPIC         題材の id を指定する（data/blog-topics.ts）
 *   BLOG_DATE          日付を指定する（YYYY-MM-DD）
 *   BLOG_FORCE=1       今日の分があっても書く
 *   BLOG_WRITE_DIR     保存先を変える（試し書き用。例: tmp-blog）
 */
import fs from "node:fs";
import path from "node:path";
import { todayJst } from "../../data/site";
import { createAsk, describeApiError, resolveModel } from "../../lib/blog/anthropic";
import { loadPosts } from "../../lib/blog/core";
import { DraftSchema, runPipeline, type Ask } from "../../lib/blog/pipeline";
import { buildSystemPrompt } from "../../lib/blog/prompt";
import { remainingTopics } from "../../lib/blog/select";

function loadEnvFile() {
  for (const name of [".env.local", ".env"]) {
    const file = path.join(process.cwd(), name);
    if (fs.existsSync(file)) {
      try {
        process.loadEnvFile(file);
      } catch {
        // 読めなくても続ける
      }
    }
  }
}

async function main() {
  loadEnvFile();

  const date = process.env.BLOG_DATE || todayJst();
  const dryRun = process.env.DRY_RUN === "1";
  const fixture = process.env.DRY_RUN_FIXTURE;
  const model = fixture ? "fixture" : resolveModel();
  const posts = loadPosts();

  console.log(`ブログ 自動投稿 — ${date}／記事 ${posts.length} 本／用意した題材の残り ${remainingTopics(posts)} 本／モデル ${model}${dryRun ? "／試し書き" : ""}`);

  let ask: Ask;
  let report = () => {};
  if (fixture) {
    // モデルの代わりに、ファイルの内容を返す（検査と保存の流れだけを確かめる）
    const data = JSON.parse(fs.readFileSync(fixture, "utf8"));
    ask = (async (schema) => schema.parse(DraftSchema.parse(data))) as Ask;
  } else {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error("ANTHROPIC_API_KEY がありません。.env.local に書いてください（.env.example を参照）");
    }
    const created = createAsk({ system: buildSystemPrompt(date), model, timeoutMs: 5 * 60 * 1000 });
    ask = created.ask;
    report = () =>
      console.log(
        `  トークン: 入力 ${created.usage.input}／出力 ${created.usage.output}／キャッシュ読込 ${created.usage.cacheRead}／呼び出し ${created.usage.calls} 回`,
      );
  }

  const result = await runPipeline({
    posts,
    date,
    model,
    ask,
    topicId: process.env.BLOG_TOPIC,
    force: process.env.BLOG_FORCE === "1" || Boolean(fixture),
    log: (line) => console.log(`  ${line}`),
  });
  report();

  if (result.status === "skipped") {
    console.log(result.reason);
    return;
  }
  if (result.status === "failed") {
    console.error(result.reason);
    process.exitCode = 1;
    return;
  }

  if (dryRun) {
    console.log("\n----- 試し書き（保存しません） -----\n");
    console.log(result.markdown);
    return;
  }

  const root = process.env.BLOG_WRITE_DIR ? path.resolve(process.env.BLOG_WRITE_DIR) : process.cwd();
  const file = path.join(root, ...result.path.split("/"));
  if (fs.existsSync(file)) throw new Error(`同じ名前の記事がすでにあります: ${file}`);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, result.markdown, "utf8");
  console.log(`  保存しました: ${path.relative(process.cwd(), file)}（${result.chars}字）`);
}

main().catch((e) => {
  console.error(`失敗しました: ${describeApiError(e)}`);
  process.exit(1);
});
