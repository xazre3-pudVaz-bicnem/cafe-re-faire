/**
 * 記事を1本書く（毎日の自動投稿の本体）。
 *
 *   本番 … GitHub Actions（.github/workflows/daily-post.yml）が毎朝これを動かし、保存された記事を main にコミットする
 *   手元 … 試し書きと、手で1本足したいとき
 *     npm run blog:dry-run     … 書いて検査するが、保存しない（原稿を表示する）
 *     npm run blog:generate    … 書いて、content/blog/ に保存する（コミットは自分で行う）
 *
 * 環境変数
 *   ANTHROPIC_API_KEY  必須（手元では .env.local、GitHub Actions ではリポジトリの Secrets に置く。リポジトリのファイルには絶対に書かない）
 *   ANTHROPIC_MODEL    使うモデル。省くと claude-haiku-4-5
 *   DRY_RUN=1          保存しない
 *   DRY_RUN_FIXTURE    原稿の JSON ファイル。API を呼ばず、その内容を「モデルの出力」として検査する
 *   BLOG_TOPIC         題材の id を指定する（data/blog-topics.ts）
 *   BLOG_DATE          日付を指定する（YYYY-MM-DD）
 *   BLOG_FORCE=1       今日の分があっても書く
 *   BLOG_WRITE_DIR     保存先を変える（試し書き用。例: tmp-blog）
 *
 * GitHub Actions で動くときは、次の手順に渡す値（GITHUB_OUTPUT の status・path・title）と、
 * 実行の概要（GITHUB_STEP_SUMMARY）も書く。
 */
import fs from "node:fs";
import path from "node:path";
import { todayJst } from "../../data/site";
import { createAsk, describeApiError, resolveModel, type Usage } from "../../lib/blog/anthropic";
import { loadPosts } from "../../lib/blog/core";
import { DraftSchema, runPipeline, type Ask } from "../../lib/blog/pipeline";
import { buildSystemPrompt } from "../../lib/blog/prompt";
import { remainingTopics } from "../../lib/blog/select";

/** この時間を過ぎたら、新しい試行を始めない（GitHub Actions のジョブの制限 30 分より前に、きりよく終える） */
const WORK_BUDGET_MS = 20 * 60 * 1000;

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

/** GitHub Actions のときだけ：次の手順に値を渡す（1行の値だけ。改行は空白にする） */
function setOutputs(values: Record<string, string>) {
  const file = process.env.GITHUB_OUTPUT;
  if (!file) return;
  const lines = Object.entries(values).map(([key, value]) => `${key}=${value.replace(/[\r\n]+/g, " ")}`);
  fs.appendFileSync(file, `${lines.join("\n")}\n`, "utf8");
}

/** GitHub Actions のときだけ：実行の概要（Summary）に書く */
function summary(markdown: string) {
  const file = process.env.GITHUB_STEP_SUMMARY;
  if (file) fs.appendFileSync(file, `${markdown}\n\n`, "utf8");
}

/** GitHub Actions のときだけ：実行の画面に、失敗の理由を目立たせて出す */
function annotateError(message: string) {
  if (process.env.GITHUB_ACTIONS !== "true") return;
  const escaped = message.replace(/%/g, "%25").replace(/\r/g, "%0D").replace(/\n/g, "%0A");
  console.log(`::error title=毎日の自動投稿::${escaped}`);
}

async function main() {
  loadEnvFile();

  const started = Date.now();
  const date = process.env.BLOG_DATE || todayJst();
  const dryRun = process.env.DRY_RUN === "1";
  const fixture = process.env.DRY_RUN_FIXTURE;
  const model = fixture ? "fixture" : resolveModel();
  const posts = loadPosts();

  const head = `${date}／記事 ${posts.length} 本／用意した題材の残り ${remainingTopics(posts)} 本／モデル ${model}${dryRun ? "／試し書き" : ""}`;
  console.log(`ブログ 自動投稿 — ${head}`);
  summary(`### 毎日の自動投稿\n\n${head}`);

  let ask: Ask;
  let usage: Usage | undefined;
  if (fixture) {
    // モデルの代わりに、ファイルの内容を返す（検査と保存の流れだけを確かめる）
    const data = JSON.parse(fs.readFileSync(fixture, "utf8"));
    ask = (async (schema) => schema.parse(DraftSchema.parse(data))) as Ask;
  } else {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error("ANTHROPIC_API_KEY がありません。手元では .env.local に、GitHub Actions ではリポジトリの Secrets に入れてください");
    }
    const created = createAsk({ system: buildSystemPrompt(date), model, timeoutMs: 5 * 60 * 1000 });
    ask = created.ask;
    usage = created.usage;
  }

  const result = await runPipeline({
    posts,
    date,
    model,
    ask,
    topicId: process.env.BLOG_TOPIC || undefined,
    force: process.env.BLOG_FORCE === "1" || Boolean(fixture),
    deadline: started + WORK_BUDGET_MS,
    log: (line) => console.log(`  ${line}`),
  });
  const tokens = usage
    ? `トークン: 入力 ${usage.input}／出力 ${usage.output}／キャッシュ読込 ${usage.cacheRead}／呼び出し ${usage.calls} 回`
    : "";
  if (tokens) console.log(`  ${tokens}`);

  if (result.status === "skipped") {
    console.log(result.reason);
    setOutputs({ status: "skipped" });
    summary(`${result.reason}。何もしません。`);
    return;
  }
  if (result.status === "failed") {
    console.error(result.reason);
    setOutputs({ status: "failed" });
    const problems = result.problems.slice(0, 20).map((p) => `- [${p.code}] ${p.message}`);
    summary([`**公開しません**：${result.reason}`, ...problems, tokens].filter(Boolean).join("\n"));
    annotateError(result.reason);
    process.exitCode = 1;
    return;
  }

  const facts = `「${result.draft.title}」（${result.chars}字・試行 ${result.attempts} 回）`;

  if (dryRun) {
    console.log("\n----- 試し書き（保存しません） -----\n");
    console.log(result.markdown);
    setOutputs({ status: "dry_run" });
    summary(
      [
        `試し書き（保存しません）：${facts}`,
        tokens,
        `<details><summary>原稿</summary>\n\n\`\`\`\`markdown\n${result.markdown}\n\`\`\`\`\n\n</details>`,
      ]
        .filter(Boolean)
        .join("\n\n"),
    );
    return;
  }

  const root = process.env.BLOG_WRITE_DIR ? path.resolve(process.env.BLOG_WRITE_DIR) : process.cwd();
  const file = path.join(root, ...result.path.split("/"));
  if (fs.existsSync(file)) throw new Error(`同じ名前の記事がすでにあります: ${file}`);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, result.markdown, "utf8");
  const saved = path.relative(process.cwd(), file).split(path.sep).join("/");
  console.log(`  保存しました: ${saved}（${result.chars}字）`);
  setOutputs({ status: "saved", path: saved, title: result.draft.title });
  summary([`保存しました：${facts}`, `\`${saved}\``, tokens].filter(Boolean).join("\n\n"));
}

main().catch((e) => {
  const message = describeApiError(e);
  console.error(`失敗しました: ${message}`);
  annotateError(message);
  process.exit(1);
});
