import { currentMonthNotices, hm, jaDay, site } from "@/data/site";

/**
 * その月だけの営業日（不定休・時間の変更）。data/site.ts の monthNotices から出す。
 * 過ぎた月は出ない。載せる月が無いときは、Instagram を案内する一文だけになる。
 */
export function MonthCalendar() {
  const notices = currentMonthNotices();

  if (notices.length === 0) {
    return (
      <p className="measure">
        不定休の日は、
        <a href={site.instagram.url} target="_blank" rel="noopener noreferrer" className="link">
          店のInstagram
          <span className="sr-only">（別のタブで開きます）</span>
        </a>
        でお知らせしています。
      </p>
    );
  }

  return (
    <div className="space-y-12">
      {notices.map((n) => {
        const [year, month] = n.month.split("-").map(Number);
        return (
          <div key={n.month}>
            <h3 className="t-h3">
              {year}年{month}月
            </h3>
            <dl className="rows mt-4">
              <div className="grid grid-cols-[5.5em_minmax(0,1fr)] gap-x-5 py-5 md:grid-cols-[7.5em_minmax(0,1fr)]">
                <dt className="text-[0.8125rem] leading-[2.45] tracking-[0.1em] text-mute">休み</dt>
                <dd className="text-ink">
                  <p>毎週{site.hours.closedDay}日</p>
                  <ul>
                    {n.closed.map((c) => (
                      <li key={c.date}>
                        <time dateTime={c.date}>{jaDay(c.date)}</time>
                        {c.reason && <span className="ml-[0.8em] text-[0.875rem] text-ink-2">{c.reason}</span>}
                      </li>
                    ))}
                  </ul>
                </dd>
              </div>
              {n.changed.length > 0 && (
                <div className="grid grid-cols-[5.5em_minmax(0,1fr)] gap-x-5 py-5 md:grid-cols-[7.5em_minmax(0,1fr)]">
                  <dt className="text-[0.8125rem] leading-[2.45] tracking-[0.1em] text-mute">時間の変更</dt>
                  <dd className="text-ink">
                    <ul>
                      {n.changed.map((c) => (
                        <li key={c.date}>
                          <time dateTime={c.date}>{jaDay(c.date)}</time>
                          <span className="ml-[0.8em]">
                            {hm(c.opens)}〜{hm(c.closes)}
                          </span>
                          {c.reason && <span className="ml-[0.8em] text-[0.875rem] text-ink-2">{c.reason}</span>}
                        </li>
                      ))}
                    </ul>
                  </dd>
                </div>
              )}
            </dl>
          </div>
        );
      })}
      <p className="t-note">
        予定は変わることがあります。最新の営業日は、
        <a href={site.instagram.url} target="_blank" rel="noopener noreferrer" className="link">
          店のInstagram
          <span className="sr-only">（別のタブで開きます）</span>
        </a>
        でご確認ください。
      </p>
    </div>
  );
}
