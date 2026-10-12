import { closedLine, hm, site } from "@/data/site";

/**
 * 営業時間を、大きな数字で見せる（店舗情報の区画の主役）。
 * 値はすべて data/site.ts から出す。曜日の名前も、定休日から計算する（ここに直接書かない）。
 */
export function Hours() {
  const { weekday, sundayHoliday, closedDay } = site.hours;
  // 定休日と日曜を除いた曜日（日曜と祝日は、別の時間）
  const weekdays = ["月", "火", "水", "木", "金", "土"].filter((d) => !closedDay.startsWith(d)).join("・");
  const rows = [
    { label: weekdays, ...weekday },
    { label: "日曜・祝日", ...sundayHoliday },
  ];

  return (
    <dl className="hours rows" data-reveal="rows">
      {rows.map((row) => (
        <div key={row.label}>
          <dt>{row.label}</dt>
          <dd className="mt-1 flex flex-wrap items-baseline gap-x-6 gap-y-1">
            <span className="hours-time">
              {hm(row.opens)}
              <span className="hours-dash" aria-hidden="true" />
              <span className="sr-only">〜</span>
              {hm(row.closes)}
            </span>
            <span className="hours-note">L.O. {hm(row.lastOrder)}</span>
          </dd>
        </div>
      ))}
      <div>
        <dt>定休日</dt>
        <dd className="mt-1 font-[family-name:var(--font-mincho)] text-[1.25rem] leading-[1.7] tracking-[0.08em] text-ink md:text-[1.5rem]">{closedLine}</dd>
      </div>
    </dl>
  );
}
