import { site } from "@/data/site";

/**
 * 店名の組み方（1語目は立体、残りは斜体）。看板の「Cafe Re faire」の雰囲気に合わせている。
 * 文字は data/site.ts の店名から出す。書体は、置く場所の class（.logo・.footer-mark など）が決める。
 */
export function Wordmark() {
  const [head, ...rest] = site.name.split(" ");
  return (
    <>
      {head} <i>{rest.join(" ")}</i>
    </>
  );
}
