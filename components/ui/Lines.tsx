import { Fragment, type CSSProperties, type ReactNode } from "react";

/**
 * 大見出しを、意味のまとまり（行）ごとに分けて組む。
 * 1つのまとまりが1行になり、画面に入ると、行ごとに下からせり上がって現れる
 * （1文字ずつ散らばる動きにはしない）。
 *
 * 現れる動きは、親の要素に data-reveal="lines" を付けたとき（または、ページの冒頭・最初の画面の中）に付く。
 *
 * spaced … 欧文のとき。行のあいだに空白を入れる（画面には出ないが、文字として読み取るときに語がつながらないように）。
 *          和文では入れない（文の途中に空白が入ってしまうため）。
 */
export function Lines({ lines, spaced = false }: { lines: ReactNode[]; spaced?: boolean }) {
  return (
    <>
      {lines.map((line, i) => (
        <Fragment key={i}>
          {spaced && i > 0 ? " " : null}
          <span className="line" style={{ "--i": i } as CSSProperties}>
            <span className="line-in">{line}</span>
          </span>
        </Fragment>
      ))}
    </>
  );
}
