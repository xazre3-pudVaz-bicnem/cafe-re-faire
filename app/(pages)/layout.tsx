import { Header } from "@/components/layout/Header";

/** 下層ページの共通の枠（ヘッダーは、最初から地の色で出す） */
export default function PagesLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main id="main">{children}</main>
    </>
  );
}
