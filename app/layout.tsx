import type { Metadata, Viewport } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";
import Nav from "@/components/Nav";

const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-dm-sans", weight: ["400","500","600","700"], display: "swap" });

export const metadata: Metadata = {
  title: { default: "InfoHub", template: "%s | InfoHub" },
  description: "ニュース × EDINET 企業情報 統合ダッシュボード",
};
export const viewport: Viewport = { themeColor: "#0D1B2A" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" className={dmSans.variable}>
      <body className="font-sans min-h-screen bg-paper">
        <Nav />
        <main>{children}</main>
        <footer className="border-t border-paper-border mt-12 py-6 text-center text-2xs text-ink-faint">
          InfoHub — ニュース（RSS公開フィード）・EDINET（金融庁公開データ）利用 / 投資判断の参考目的のみ
        </footer>
      </body>
    </html>
  );
}
