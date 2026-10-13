/** 下層ページの共通の枠。ヘッダーとフッターは、全ページ共通の枠（app/layout.tsx）にある */
export default function PagesLayout({ children }: { children: React.ReactNode }) {
  return <main id="main">{children}</main>;
}
