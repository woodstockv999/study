/** @type {import('next').NextConfig} */

// マルチアプリのポータル配下（例 /briefing）で動かす場合は
// ビルド時に NEXT_BASE_PATH=/briefing を設定する。
// 未設定ならルート("")で動作（後方互換）。
const basePath = process.env.NEXT_BASE_PATH || "";

const nextConfig = {
  reactStrictMode: true,
  basePath: basePath || undefined,
  // クライアント側 fetch でも同じ接頭辞を使えるよう公開
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
};

export default nextConfig;
