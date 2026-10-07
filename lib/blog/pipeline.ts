/**
 * 記事を1本つくる流れ（毎日の自動投稿の中心）。
 *
 *   1. 今日の分がすでにあれば、何もしない
 *   2. 題材を選ぶ（用意した題材が尽きていたら、モデルに1つ提案させて検査する）
 *   3. モデルに書かせる
 *   4. 検査する（lib/blog/validate.ts）。落ちたら、指摘を渡して直させる
 *   5. 通った原稿だけを返す。通らなければ「今日は公開しない」
 *
 * ここは、モデルの呼び出し方と保存先を知らない（引数で受け取る）。
 * そのため、Vercel の API ルート（GitHub に保存）と、手元のスクリプト（ファイルに保存）で同じものを使える。
 */
import { z } from "zod";
import { topics, type Topic } from "../../data/blog-topics";
import type { PhotoKey } from "../../data/photo-meta";
import { parsePostSource, postFilePath, type Post } from "./core";
import { buildRevisionPrompt, buildTopicProposalPrompt, buildUserPrompt } from "./prompt";
import { categoryForProposal, checkProposedTopic, pickEyecatch, relatedCandidates, selectFormat, selectTopics, type Format } from "./select";
import { plainText } from "./text";
import { validateArticle, type Draft, type Problem } from "./validate";

export const DraftSchema = z.object({
  title: z.string(),
  description: z.string(),
  body: z.string(),
  keywords: z.array(z.string()),
});

export const TopicSchema = z.object({
  id: z.string(),
  category: z.string(),
  focusKeyword: z.string(),
  angle: z.string(),
  pillar: z.string(),
  photoKind: z.string(),
});

export type ChatMessage = { role: "user" | "assistant"; content: string };

/** モデルに問い合わせて、決めた形（schema）の答えを受け取る関数 */
export type Ask = <T>(schema: z.ZodType<T>, messages: ChatMessage[]) => Promise<T>;

export type PipelineOptions = {
  /** いま公開されている全記事 */
  posts: Post[];
  /** 記事の日付（日本時間 YYYY-MM-DD） */
  date: string;
  /** 使ったモデルの名前（記事の frontmatter に残す） */
  model: string;
  ask: Ask;
  /** 題材を指定して書かせる（試したい題材があるとき） */
  topicId?: string;
  /** 今日の分があっても書く */
  force?: boolean;
  /** これを過ぎたら、新しい試行を始めない（関数の制限時間に収めるため）。Date.now() の値 */
  deadline?: number;
  log?: (line: string) => void;
};

export type PipelineResult =
  | {
      status: "published";
      slug: string;
      /** リポジトリ内の保存先（content/blog/2026/2026-10-08-xxx.md） */
      path: string;
      markdown: string;
      draft: Draft;
      topic: Topic;
      format: string;
      eyecatch: PhotoKey;
      chars: number;
      attempts: number;
    }
  | { status: "skipped"; reason: string }
  | { status: "failed"; reason: string; problems: Problem[]; topicId?: string };

/** 1つの題材に対する試行の回数（先頭の題材／控えの題材） */
const ATTEMPTS = [3, 2];
/** 1回の試行にかかる時間の見込み（ミリ秒）。残り時間がこれより短ければ、新しい試行を始めない */
const ATTEMPT_BUDGET_MS = 75_000;

function cleanDraft(d: Draft): Draft {
  return {
    title: d.title.trim().replace(/\s*\n\s*/g, ""),
    description: d.description.trim().replace(/\s*\n\s*/g, ""),
    body: d.body.replace(/\r\n/g, "\n").trim(),
    keywords: [...new Set(d.keywords.map((k) => k.trim()).filter(Boolean))].slice(0, 6),
  };
}

/** frontmatter つきの Markdown にする */
export function toMarkdown(args: {
  draft: Draft;
  topic: Topic;
  date: string;
  format: string;
  eyecatch: PhotoKey;
  model: string;
}): string {
  const { draft, topic, date, format, eyecatch, model } = args;
  const q = (s: string) => JSON.stringify(s);
  const related = [...new Set([topic.pillar, "/about", "/access"])].slice(0, 3);
  const front = [
    "---",
    `title: ${q(draft.title)}`,
    `description: ${q(draft.description)}`,
    `slug: ${q(topic.id)}`,
    `publishedAt: ${q(date)}`,
    `updatedAt: ${q(date)}`,
    `category: ${q(topic.category)}`,
    `focusKeyword: ${q(topic.focusKeyword)}`,
    `keywords: [${draft.keywords.map(q).join(", ")}]`,
    `eyecatch: ${q(eyecatch)}`,
    `relatedPages: [${related.map(q).join(", ")}]`,
    `topicId: ${q(topic.id)}`,
    `format: ${q(format)}`,
    `author: "auto"`,
    `model: ${q(model)}`,
    "---",
    "",
  ].join("\n");
  return `${front}\n${draft.body.trim()}\n`;
}

async function proposeTopic(opts: PipelineOptions, log: (s: string) => void): Promise<Topic | undefined> {
  const category = categoryForProposal(opts.posts);
  const messages: ChatMessage[] = [
    {
      role: "user",
      content: buildTopicProposalPrompt({
        category,
        posts: opts.posts,
        topicKeywords: topics.map((t) => t.focusKeyword),
        month: Number(opts.date.slice(5, 7)),
      }),
    },
  ];
  for (let i = 1; i <= 3; i++) {
    const raw = await opts.ask(TopicSchema, messages);
    const { topic, errors } = checkProposedTopic(raw, opts.posts);
    if (topic) {
      log(`題材を新しく作りました: ${topic.focusKeyword}（${topic.id}）`);
      return topic;
    }
    log(`題材の提案 ${i} 回目は不採用: ${errors.join(" / ")}`);
    messages.push({ role: "assistant", content: JSON.stringify(raw) });
    messages.push({ role: "user", content: `この題材は使えません。理由: ${errors.join("。")}。別の題材を1つ提案してください。` });
  }
  return undefined;
}

async function writeTopic(
  topic: Topic,
  maxAttempts: number,
  opts: PipelineOptions,
  log: (s: string) => void,
): Promise<{ draft?: Draft; format: Format; problems: Problem[]; attempts: number }> {
  const format = selectFormat(topic, opts.posts);
  const candidates = relatedCandidates(topic, opts.posts);
  const target = { slug: topic.id, category: topic.category, focusKeyword: topic.focusKeyword, pillar: topic.pillar, facts: topic.facts };
  log(`題材: ${topic.focusKeyword}（${topic.id}／${topic.category}／型 ${format.id}）`);

  const messages: ChatMessage[] = [
    {
      role: "user",
      content: buildUserPrompt({
        topic,
        format,
        date: opts.date,
        candidates,
        recentTitles: opts.posts.slice(0, 12).map((p) => p.title),
      }),
    },
  ];

  let problems: Problem[] = [];
  let attempts = 0;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    if (opts.deadline && Date.now() + ATTEMPT_BUDGET_MS > opts.deadline) {
      log("残り時間が足りないので、ここでやめます");
      break;
    }
    attempts = attempt;
    const draft = cleanDraft(await opts.ask(DraftSchema, messages));
    problems = validateArticle(draft, target, opts.posts, opts.date);
    const chars = plainText(draft.body).length;
    if (problems.length === 0) {
      log(`試行 ${attempt}: 合格（${chars}字）「${draft.title}」`);
      return { draft, format, problems, attempts };
    }
    log(`試行 ${attempt}: 不合格（${chars}字）— ${problems.length} 件`);
    for (const p of problems) log(`    - [${p.code}] ${p.message}`);

    // 指摘だけを渡して、同じ原稿を直させる（全文を書き直させると、別の所に新しい誤りが入る）
    messages.push({ role: "assistant", content: JSON.stringify(draft) });
    messages.push({ role: "user", content: buildRevisionPrompt(problems) });
  }
  return { format, problems, attempts };
}

export async function runPipeline(opts: PipelineOptions): Promise<PipelineResult> {
  const log = opts.log ?? (() => {});
  const { posts, date } = opts;

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return { status: "failed", reason: `日付の形が違います: ${date}`, problems: [] };

  if (!opts.force && posts.some((p) => p.publishedAt === date && p.author === "auto")) {
    return { status: "skipped", reason: "今日の分は、すでに公開されています" };
  }

  let candidates = selectTopics(posts, date, opts.topicId);
  if (opts.topicId && candidates.length === 0) {
    return { status: "failed", reason: `題材が見つかりません: ${opts.topicId}`, problems: [] };
  }
  if (candidates.length === 0) {
    log("用意した題材を書き終えました。新しい題材を作ります");
    const proposed = await proposeTopic(opts, log);
    if (!proposed) {
      return { status: "failed", reason: "新しい題材を作れませんでした。data/blog-topics.ts に題材を足してください", problems: [] };
    }
    candidates = [proposed];
  }

  let last: { problems: Problem[]; topicId?: string } = { problems: [] };
  for (let i = 0; i < Math.min(candidates.length, ATTEMPTS.length); i++) {
    const topic = candidates[i];
    const { draft, format, problems, attempts } = await writeTopic(topic, ATTEMPTS[i], opts, log);
    last = { problems, topicId: topic.id };
    if (!draft) continue;

    const eyecatch = pickEyecatch(topic, posts);
    const markdown = toMarkdown({ draft, topic, date, format: format.id, eyecatch, model: opts.model });
    const path = postFilePath(date, topic.id);

    // 保存する前に、サイトが読める形になっているかを確かめる（frontmatter の崩れを公開しない）
    const parsed = parsePostSource(path, markdown);
    if (!parsed.post) {
      last = { problems: [{ code: "format", message: `保存する形にできませんでした: ${parsed.error}` }], topicId: topic.id };
      continue;
    }
    return { status: "published", slug: topic.id, path, markdown, draft, topic, format: format.id, eyecatch, chars: parsed.post.chars, attempts };
  }

  return { status: "failed", reason: "検査を通る原稿ができませんでした。今日は公開しません", ...last };
}
