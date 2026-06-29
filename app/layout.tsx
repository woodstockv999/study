import type { Metadata, Viewport } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "IT ニュース ブリーフィング",
  description:
    "AI・テック・DXの最新動向を毎日5分でキャッチアップ。日経クロステック代替の個人用ブリーフィングアプリ。",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0D1B2A",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja" className={dmSans.variable}>
      <body>{children}</body>
    </html>
  );
}
