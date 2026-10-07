/**
 * Claude API の呼び出し。
 *
 * モデルは環境変数 ANTHROPIC_MODEL で切り替える。省くと claude-haiku-4-5（費用を抑えるため）。
 * 上位のモデルに替えても動くように、モデルごとに扱いの違う指定（thinking・temperature・effort）は付けていない。
 */
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import type { z } from "zod";
import type { Ask, ChatMessage } from "./pipeline";

/** 既定のモデル */
export const DEFAULT_MODEL = "claude-haiku-4-5";

export function resolveModel(): string {
  return (process.env.ANTHROPIC_MODEL || process.env.CLAUDE_MODEL || DEFAULT_MODEL).trim();
}

export type Usage = { input: number; output: number; cacheRead: number; cacheWrite: number; calls: number };

export function createAsk(args: { system: string; model: string; apiKey?: string; timeoutMs?: number }): { ask: Ask; usage: Usage } {
  // apiKey を渡さなければ、環境変数 ANTHROPIC_API_KEY が使われる
  const client = new Anthropic({ ...(args.apiKey ? { apiKey: args.apiKey } : {}), maxRetries: 2, timeout: args.timeoutMs ?? 120_000 });
  const usage: Usage = { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, calls: 0 };

  const ask: Ask = async <T>(schema: z.ZodType<T>, messages: ChatMessage[]): Promise<T> => {
    const response = await client.messages.parse({
      model: args.model,
      max_tokens: 16000,
      // 書き直しのあいだ同じ内容なので、キャッシュから読めるようにしておく
      system: [{ type: "text", text: args.system, cache_control: { type: "ephemeral" } }],
      messages,
      output_config: { format: zodOutputFormat(schema) },
    });

    usage.calls += 1;
    usage.input += response.usage.input_tokens;
    usage.output += response.usage.output_tokens;
    usage.cacheRead += response.usage.cache_read_input_tokens ?? 0;
    usage.cacheWrite += response.usage.cache_creation_input_tokens ?? 0;

    if (response.stop_reason === "refusal") throw new Error("モデルが応答を断りました（refusal）");
    if (response.stop_reason === "max_tokens") throw new Error("出力が途中で切れました（max_tokens）");
    if (!response.parsed_output) throw new Error("出力を解釈できませんでした");
    return response.parsed_output;
  };

  return { ask, usage };
}

/** API のエラーを、原因の分かることばにする */
export function describeApiError(e: unknown): string {
  if (e instanceof Anthropic.AuthenticationError) return "API キーが正しくありません（ANTHROPIC_API_KEY を確かめてください）";
  if (e instanceof Anthropic.PermissionDeniedError) return "この API キーでは、指定のモデルを使えません";
  if (e instanceof Anthropic.NotFoundError) return "モデルが見つかりません（ANTHROPIC_MODEL を確かめてください）";
  if (e instanceof Anthropic.RateLimitError) return "利用の上限に達しました（時間をおいて再実行してください）";
  if (e instanceof Anthropic.BadRequestError) return `リクエストが受け付けられませんでした: ${e.message}`;
  if (e instanceof Anthropic.APIConnectionError) return "API に接続できませんでした";
  if (e instanceof Anthropic.APIError) return `API エラー（${e.status}）: ${e.message}`;
  return e instanceof Error ? e.message : String(e);
}
