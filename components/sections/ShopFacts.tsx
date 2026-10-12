import Link from "next/link";
import { pages } from "@/data/pages";
import {
  closedLine,
  currentMonthNotices,
  fullAddress,
  parkingLine,
  paymentLine,
  site,
  sundayHours,
  telHref,
  weekdayHours,
} from "@/data/site";

/**
 * 店舗情報の表。値はすべて data/site.ts から出す（住所・電話・営業時間を、全ページで同じ書き方にするため）。
 * 確かめられていない項目（null のもの）は、行ごと出さない。
 */
export function ShopFacts({ withAccessLinks = false }: { withAccessLinks?: boolean }) {
  const notice = currentMonthNotices()[0];
  const noticeMonth = notice ? Number(notice.month.slice(5, 7)) : null;

  return (
    <dl className="facts" data-reveal="rows">
      <div>
        <dt>店名</dt>
        <dd>
          {site.name}
          <span className="block text-[0.8125rem] leading-[1.8] tracking-[0.08em] text-ink-2">{site.reading}</span>
        </dd>
      </div>
      <div>
        <dt>住所</dt>
        <dd>
          <address>{fullAddress}</address>
          <p className="t-note mt-1">{site.access.road}</p>
        </dd>
      </div>
      <div>
        <dt>営業時間</dt>
        <dd>
          <p>{weekdayHours}</p>
          <p>
            日曜・祝日は {sundayHours}
          </p>
        </dd>
      </div>
      <div>
        <dt>定休日</dt>
        <dd>
          <p>{closedLine}</p>
          {withAccessLinks && noticeMonth && (
            <p className="t-note mt-1">
              <Link href={`${pages.access.path}#calendar`} className="link">
                {noticeMonth}月の営業日
              </Link>
              を、アクセスのページに載せています。
            </p>
          )}
        </dd>
      </div>
      <div>
        <dt>駐車場</dt>
        <dd>{parkingLine}</dd>
      </div>
      {site.phone && telHref && (
        <div>
          <dt>電話</dt>
          <dd>
            <a href={telHref} className="link inline-flex min-h-11 items-center">
              <span className="num">{site.phone.display}</span>
            </a>
          </dd>
        </div>
      )}
      <div>
        <dt>予約</dt>
        <dd>{site.reservation.by}で受け付けています。</dd>
      </div>
      <div>
        <dt>支払い</dt>
        <dd>{paymentLine}</dd>
      </div>
      <div>
        <dt>Instagram</dt>
        <dd>
          <a href={site.instagram.url} target="_blank" rel="noopener noreferrer" className="link inline-flex min-h-11 items-center">
            @{site.instagram.handle}
            <span className="sr-only">（別のタブで開きます）</span>
          </a>
        </dd>
      </div>
    </dl>
  );
}
