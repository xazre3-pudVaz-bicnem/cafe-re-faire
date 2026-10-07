import { cakePrice, cakes } from "@/data/menu";
import { jaDate, jaTime, site } from "@/data/site";

/**
 * 03 店の使いかた。
 * 店の考えを、こちらで作って書かない。書くのは、店が Instagram に書いていることば（引用）と、
 * 営業時間・メニューから分かる事実だけ。店主のことばが届いたら、ここを差し替える（docs/TODO.md）。
 */
export function Concept() {
  const { weekday, sundayHoliday } = site.hours;
  const { welcome } = site.words;
  const rows = [
    {
      term: "朝",
      body: `${jaTime(weekday.opens)}に開きます。平日は${jaTime(weekday.closes)}まで、日曜と祝日は${jaTime(sundayHoliday.closes)}まで。`,
    },
    { term: "昼", body: "曜日ごとに内容の替わる、曜日プレート。" },
    { term: "甘いもの", body: `ショーケースに、ケーキが${cakes.length}種類。各${cakePrice}円。` },
    { term: "持ち帰り", body: `弁当は${site.takeout.kinds}種類。先に注文しておくと、受け取りがスムーズです。` },
  ];

  return (
    <section className="section">
      <div className="wrap grid gap-y-12 lg:grid-cols-12 lg:gap-x-8">
        <div className="lg:col-span-5">
          <h2 className="t-h2">
            <span className="ib">食事でも、</span>
            <span className="ib">ケーキだけでも。</span>
          </h2>
          <figure className="measure mt-8 md:mt-10">
            <blockquote
              cite={welcome.source}
              className="border-l border-door pl-5 font-[family-name:var(--font-mincho)] text-[1.0625rem] leading-[2.1] tracking-[0.06em] text-ink"
            >
              <p>{welcome.text}</p>
            </blockquote>
            <figcaption className="t-note mt-3 pl-5">
              {site.name}のInstagramより（{jaDate(welcome.date)}の投稿）
            </figcaption>
          </figure>
          <p className="measure mt-8">昼をしっかり食べる日も、甘いものと飲みものだけの日も。使いかたは、その日の気分で決めてください。</p>
        </div>

        <dl className="rows self-end lg:col-span-6 lg:col-start-7">
          {rows.map((row) => (
            <div key={row.term} className="grid grid-cols-[5.5em_minmax(0,1fr)] gap-x-5 py-6 md:grid-cols-[7.5em_minmax(0,1fr)] md:py-7">
              <dt className="font-[family-name:var(--font-mincho)] text-[1.0625rem] tracking-[0.12em] text-ink">{row.term}</dt>
              <dd>{row.body}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
