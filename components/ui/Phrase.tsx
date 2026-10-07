import { loadDefaultJapaneseParser } from "budoux";

/**
 * データから来る見出し（記事の題名など）を、文節ごとに折り返せるようにする。
 * サーバーで実行するので、ブラウザには辞書も JS も送らない。
 * 手書きの見出しは、<span className="ib"> で自分で区切るほうが確実。
 */
const parser = loadDefaultJapaneseParser();

const NO_START = /^[、。，．・」』）〕】！？ー～〜｜…]/;
const NO_END = /[「『（〔【]$/;
const ALNUM_END = /[0-9A-Za-z０-９-]$/;
const ALNUM_START = /^[0-9A-Za-z０-９-]/;

export function splitPhrases(text: string): string[] {
  const out: string[] = [];
  for (const seg of parser.parse(text)) {
    const prev = out[out.length - 1];
    const joinToPrev =
      prev !== undefined &&
      (NO_START.test(seg) || NO_END.test(prev) || (ALNUM_END.test(prev) && ALNUM_START.test(seg)) || seg.length === 1);
    if (joinToPrev) out[out.length - 1] = prev + seg;
    else out.push(seg);
  }
  return out;
}

export function Phrase({ children }: { children: string }) {
  return (
    <>
      {splitPhrases(children).map((seg, i) => (
        <span key={i} className="ib">
          {seg}
        </span>
      ))}
    </>
  );
}
