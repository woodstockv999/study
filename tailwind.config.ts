import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Paper: 温かみのある紙ベースの背景色
        paper: {
          DEFAULT: "#F8F5F0",
          surface: "#FFFFFF",
          border: "#E7E2D8",
          dark: "#EDEAD3",
        },
        // Ink: 本文テキスト（warm near-black）
        ink: {
          DEFAULT: "#1C1917",
          mid: "#44403C",
          muted: "#78716C",
          faint: "#B4AFA9",
        },
        // Accent: ニュース赤（一次アクション・強調）
        accent: {
          DEFAULT: "#C62828",
          hover: "#AD1F1F",
          soft: "#FDF0F0",
          border: "#FECACA",
        },
        // Navy: ヘッダー・ナビゲーション
        navy: {
          DEFAULT: "#0D1B2A",
          mid: "#1E3A5F",
          muted: "#4A6FA5",
          surface: "#162032",
        },
      },
      fontFamily: {
        sans: [
          "var(--font-dm-sans)",
          '"Hiragino Kaku Gothic ProN"',
          '"Hiragino Sans"',
          '"Yu Gothic UI"',
          '"Meiryo"',
          "system-ui",
          "sans-serif",
        ],
        mono: ['"DM Mono"', "ui-monospace", "monospace"],
      },
      fontSize: {
        "2xs": ["0.6875rem", { lineHeight: "1rem" }],
      },
    },
  },
  plugins: [],
};

export default config;
