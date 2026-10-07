/**
 * GitHub への保存（Contents API）。
 *
 * 記事は、リポジトリの content/blog/ に Markdown のファイルとしてコミットする。
 * コミットされると、いつもどおり GitHub → Vercel のデプロイが走り、記事が公開される。
 *
 * トークンは Fine-grained personal access token を使い、権限は
 *   対象のリポジトリ1つだけ ／ Contents: Read and write
 * に絞る（README の「GitHub 側の設定」）。値は環境変数からだけ読む。
 */
import { BLOG_DIR_REL } from "./core";

export type GitHubConfig = {
  token: string;
  owner: string;
  repo: string;
  branch: string;
  /** API の場所。ふつうは https://api.github.com（GitHub Enterprise や、試験のときだけ変える） */
  apiUrl: string;
};

/** 環境変数から設定を読む。足りないものがあれば、その名前を返す */
export function readGitHubConfig(): { config?: GitHubConfig; missing: string[] } {
  const token = process.env.GITHUB_TOKEN?.trim();
  const owner = process.env.GITHUB_OWNER?.trim();
  const repo = process.env.GITHUB_REPO?.trim();
  const branch = process.env.GITHUB_BRANCH?.trim() || "main";
  const apiUrl = (process.env.GITHUB_API_URL?.trim() || "https://api.github.com").replace(/\/+$/, "");
  const missing = [
    ["GITHUB_TOKEN", token],
    ["GITHUB_OWNER", owner],
    ["GITHUB_REPO", repo],
  ]
    .filter(([, v]) => !v)
    .map(([k]) => k as string);
  if (missing.length) return { missing };
  return { config: { token: token!, owner: owner!, repo: repo!, branch, apiUrl }, missing };
}

export class GitHubError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "GitHubError";
  }
}

async function api(cfg: GitHubConfig, path: string, init: RequestInit & { raw?: boolean } = {}): Promise<Response> {
  const { raw, ...rest } = init;
  const res = await fetch(`${cfg.apiUrl}/repos/${cfg.owner}/${cfg.repo}${path}`, {
    ...rest,
    headers: {
      Authorization: `Bearer ${cfg.token}`,
      Accept: raw ? "application/vnd.github.raw+json" : "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "cafe-refaire-daily-post",
      ...(rest.body ? { "Content-Type": "application/json" } : {}),
    },
    cache: "no-store",
  });
  return res;
}

async function fail(res: Response, what: string): Promise<never> {
  let detail = "";
  try {
    detail = ((await res.json()) as { message?: string }).message ?? "";
  } catch {
    // 本文が JSON でなければ、状態だけを伝える
  }
  const hint =
    res.status === 401
      ? "（GITHUB_TOKEN が正しくないか、期限が切れています）"
      : res.status === 403
        ? "（トークンに Contents の書き込み権限が無いか、対象のリポジトリが選ばれていません）"
        : res.status === 404
          ? "（GITHUB_OWNER / GITHUB_REPO / GITHUB_BRANCH を確かめてください）"
          : "";
  throw new GitHubError(res.status, `GitHub: ${what}に失敗しました（${res.status} ${detail}）${hint}`);
}

/** リポジトリにある記事のファイル（content/blog/ 以下の .md）のパスを、すべて返す */
export async function listPostFiles(cfg: GitHubConfig): Promise<string[]> {
  const res = await api(cfg, `/git/trees/${encodeURIComponent(cfg.branch)}?recursive=1`);
  if (!res.ok) await fail(res, "記事の一覧の取得");
  const data = (await res.json()) as { tree: { path: string; type: string }[]; truncated?: boolean };
  if (data.truncated) {
    // ファイルがとても多いリポジトリでは一覧が途中で切れる。そのときは、年のフォルダーごとに読む
    return listPostFilesByDirectory(cfg);
  }
  return data.tree.filter((e) => e.type === "blob" && e.path.startsWith(`${BLOG_DIR_REL}/`) && e.path.endsWith(".md")).map((e) => e.path);
}

async function listDirectory(cfg: GitHubConfig, dir: string): Promise<{ path: string; type: string }[]> {
  const res = await api(cfg, `/contents/${dir}?ref=${encodeURIComponent(cfg.branch)}`);
  if (res.status === 404) return [];
  if (!res.ok) await fail(res, `${dir} の一覧の取得`);
  return (await res.json()) as { path: string; type: string }[];
}

async function listPostFilesByDirectory(cfg: GitHubConfig): Promise<string[]> {
  const out: string[] = [];
  for (const entry of await listDirectory(cfg, BLOG_DIR_REL)) {
    if (entry.type === "file" && entry.path.endsWith(".md")) out.push(entry.path);
    if (entry.type === "dir") {
      for (const file of await listDirectory(cfg, entry.path)) {
        if (file.type === "file" && file.path.endsWith(".md")) out.push(file.path);
      }
    }
  }
  return out;
}

/** ファイルの中身（文字列）を読む */
export async function readFile(cfg: GitHubConfig, path: string): Promise<string> {
  const res = await api(cfg, `/contents/${path}?ref=${encodeURIComponent(cfg.branch)}`, { raw: true });
  if (!res.ok) await fail(res, `${path} の取得`);
  return res.text();
}

/**
 * 新しいファイルを1つコミットする。
 * 同じパスにファイルがあるときは、上書きせずに "exists" を返す（二重に公開しないため）。
 */
export async function createFile(
  cfg: GitHubConfig,
  path: string,
  content: string,
  message: string,
): Promise<{ status: "created"; commitUrl?: string } | { status: "exists" }> {
  const res = await api(cfg, `/contents/${path}`, {
    method: "PUT",
    body: JSON.stringify({
      message,
      content: Buffer.from(content, "utf8").toString("base64"),
      branch: cfg.branch,
    }),
  });
  // sha を付けずに既存のファイルへ PUT すると、422（または 409）で断られる
  if (res.status === 422 || res.status === 409) return { status: "exists" };
  if (!res.ok) await fail(res, `${path} の保存`);
  const data = (await res.json()) as { commit?: { html_url?: string } };
  return { status: "created", commitUrl: data.commit?.html_url };
}
