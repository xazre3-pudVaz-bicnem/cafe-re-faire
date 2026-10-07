/**
 * 毎日の自動投稿（Vercel Cron から呼ばれる）。
 *
 *   Vercel Cron（vercel.json）
 *     → この API ルート
 *       → Claude API で記事を書く
 *         → 検査（lib/blog/validate.ts）
 *           → GitHub の content/blog/ に Markdown をコミット
 *             → いつもの GitHub → Vercel のデプロイで公開
 *
 * 守っていること
 *   ・CRON_SECRET を知っている呼び出しだけを受け付ける（Vercel Cron が Authorization ヘッダーに付けて送る）
 *   ・検査を通った原稿だけをコミットする。通らなければ、その日は公開しない
 *   ・同じ日に2回呼ばれても、記事は1本しかできない（今日の分があれば何もしない／同じファイル名は上書きしない）
 *   ・キーやトークンは環境変数からだけ読む
 *
 * 手で試すとき（本番の URL に対して。CRON_SECRET が要る）
 *   curl -H "Authorization: Bearer <CRON_SECRET>" "https://<ドメイン>/api/cron/daily-post?dry=1"
 *     dry=1      … 書いて検査するが、コミットしない（原稿が返る）
 *     topic=<id> … 題材を指定する（data/blog-topics.ts の id）
 *     date=YYYY-MM-DD … 日付を指定する
 */
import { timingSafeEqual } from "node:crypto";
import type { NextRequest } from "next/server";
import { todayJst } from "@/data/site";
import { createAsk, describeApiError, resolveModel } from "@/lib/blog/anthropic";
import { comparePosts, loadPosts, parsePostSource, type Post } from "@/lib/blog/core";
import { createFile, listPostFiles, readFile, readGitHubConfig, type GitHubConfig } from "@/lib/blog/github";
import { runPipeline } from "@/lib/blog/pipeline";
import { buildSystemPrompt } from "@/lib/blog/prompt";
import { remainingTopics } from "@/lib/blog/select";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
/** 関数の制限時間（秒）。Vercel の Hobby プランの上限に合わせている */
export const maxDuration = 300;

/** この時間（ミリ秒）を過ぎたら、新しい試行を始めない（コミットの時間を残す） */
const WORK_BUDGET_MS = 250_000;

function authorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const given = Buffer.from(request.headers.get("authorization") ?? "");
  const expected = Buffer.from(`Bearer ${secret}`);
  return given.length === expected.length && timingSafeEqual(given, expected);
}

/**
 * いま公開されている全記事。
 * ビルドに入っている記事に、ビルドのあとで GitHub に足された記事（まだデプロイされていない分）を足す。
 * こうしておくと、デプロイが終わる前にもう一度呼ばれても、同じ記事を二重に書かない。
 */
async function loadAllPosts(cfg: GitHubConfig, log: (s: string) => void): Promise<Post[]> {
  const posts = loadPosts();
  const known = new Set(posts.map((p) => p.file));
  const missing = (await listPostFiles(cfg)).filter((f) => !known.has(f) && !f.split("/").pop()!.startsWith("_"));
  if (missing.length) log(`ビルドに入っていない記事が ${missing.length} 本あります。GitHub から読みます`);

  for (let i = 0; i < missing.length; i += 8) {
    const batch = await Promise.all(
      missing.slice(i, i + 8).map(async (file) => {
        const { post, error } = parsePostSource(file, await readFile(cfg, file));
        if (!post) log(`  読み飛ばし: ${file} — ${error}`);
        return post;
      }),
    );
    for (const p of batch) if (p && !posts.some((x) => x.slug === p.slug)) posts.push(p);
  }
  return posts.sort(comparePosts);
}

export async function GET(request: NextRequest) {
  if (!authorized(request)) {
    return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const started = Date.now();
  const lines: string[] = [];
  const log = (line: string) => {
    lines.push(line);
    console.log(`[daily-post] ${line}`);
  };

  const params = request.nextUrl.searchParams;
  const dry = params.get("dry") === "1";
  const date = params.get("date") || todayJst();
  const topicId = params.get("topic") || undefined;
  const model = resolveModel();

  // 設定の確認（足りないものは、名前だけを返す。値は返さない）
  const { config, missing } = readGitHubConfig();
  if (!process.env.ANTHROPIC_API_KEY) missing.push("ANTHROPIC_API_KEY");
  if (!config || missing.length) {
    log(`環境変数が足りません: ${missing.join(", ")}`);
    return Response.json({ ok: false, status: "not_configured", missing }, { status: 500 });
  }

  try {
    const posts = await loadAllPosts(config, log);
    log(`${date}／記事 ${posts.length} 本／用意した題材の残り ${remainingTopics(posts)} 本／モデル ${model}${dry ? "／試し書き" : ""}`);

    const { ask, usage } = createAsk({ system: buildSystemPrompt(date), model });
    const result = await runPipeline({
      posts,
      date,
      model,
      ask,
      topicId,
      force: dry && Boolean(topicId),
      deadline: started + WORK_BUDGET_MS,
      log,
    });
    log(`トークン: 入力 ${usage.input}／出力 ${usage.output}／キャッシュ読込 ${usage.cacheRead}／呼び出し ${usage.calls} 回`);

    if (result.status === "skipped") {
      log(result.reason);
      return Response.json({ ok: true, status: "skipped", reason: result.reason, date });
    }
    if (result.status === "failed") {
      log(result.reason);
      return Response.json(
        { ok: false, status: "failed", reason: result.reason, topic: result.topicId, problems: result.problems, log: lines },
        { status: 500 },
      );
    }

    const summary = {
      date,
      slug: result.slug,
      path: result.path,
      title: result.draft.title,
      category: result.topic.category,
      focusKeyword: result.topic.focusKeyword,
      chars: result.chars,
      attempts: result.attempts,
      model,
      usage,
    };

    if (dry) {
      return Response.json({ ok: true, status: "dry_run", ...summary, markdown: result.markdown, log: lines });
    }

    const saved = await createFile(config, result.path, result.markdown, `blog: ${result.draft.title}`);
    if (saved.status === "exists") {
      log(`同じファイルがすでにあります（${result.path}）。上書きしません`);
      return Response.json({ ok: true, status: "skipped", reason: "同じ記事が、すでに保存されています", ...summary });
    }
    log(`コミットしました: ${result.path}`);
    return Response.json({ ok: true, status: "published", ...summary, commit: saved.commitUrl, seconds: Math.round((Date.now() - started) / 1000) });
  } catch (e) {
    const message = describeApiError(e);
    console.error("[daily-post] 失敗", e);
    return Response.json({ ok: false, status: "error", error: message, log: lines }, { status: 500 });
  }
}
