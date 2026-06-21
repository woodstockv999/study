// アプリのベースパス（マルチアプリのポータル配下で動かす場合に使用）。
// next.config.mjs の basePath と一致させる。未設定ならルート("")。
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "";

/** API ルート等への絶対パスを basePath 付きで組み立てる。 */
export function apiUrl(path: string): string {
  return `${BASE_PATH}${path}`;
}
