import type { ReactNode } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

function textOf(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textOf).join("");
  if (node && typeof node === "object" && "props" in node) return textOf((node as { props: { children?: ReactNode } }).props.children);
  return "";
}

/**
 * 記事の本文（Markdown）を描く。
 * ・サイト内のリンクは next/link に、サイト外のリンクは別のタブで開く形にする
 * ・h2 に、目次から飛べる id を付ける
 * ・本文の中の h1 は h2 に落とす（ページの h1 は題名の1つだけ）。画像と生の HTML は描かない
 */
export function ArticleBody({ body, headings }: { body: string; headings: { id: string; text: string }[] }) {
  return (
    <div className="prose">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        skipHtml
        components={{
          h1: ({ children }) => <h2>{children}</h2>,
          h2: ({ children }) => {
            const text = textOf(children).trim();
            const id = headings.find((h) => h.text === text)?.id;
            return <h2 id={id}>{children}</h2>;
          },
          a: ({ href, children }) => {
            if (!href) return <>{children}</>;
            if (href.startsWith("/") || href.startsWith("#")) return <Link href={href}>{children}</Link>;
            return (
              <a href={href} target="_blank" rel="noopener noreferrer">
                {children}
                <span className="sr-only">（別のタブで開きます）</span>
              </a>
            );
          },
          img: () => null,
          th: ({ children }) => <th scope="col">{children}</th>,
          table: ({ children }) => (
            <div className="overflow-x-auto">
              <table>{children}</table>
            </div>
          ),
        }}
      >
        {body}
      </ReactMarkdown>
    </div>
  );
}
