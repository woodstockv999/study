# マルチアプリ受け皿（1つのVPSで複数アプリ）

1つのVPS・80番ポートだけで、トップの**選択ポータル**から各アプリへ振り分ける構成です。
ドメイン不要・IP直アクセス(HTTP)で動きます。

```
http://<VPS-IP>/            ポータル（選択画面 / 静的HTML）
http://<VPS-IP>/briefing    業界ブリーフィングBot（:3000）
http://<VPS-IP>/<app>       追加アプリ（:3001, :3002, …）
```

## 仕組み
- **nginx** が 80番で受け、パスごとに各アプリ（別ポートで常駐）へプロキシ。
- **ポータル**は `deploy/multi-app/portal/index.html` の `APPS` 配列を編集するだけで増やせる静的ページ。
- 各アプリは **自分のポート**で `pm2` 常駐。Next.js の場合は **`basePath=/<app>`** を付けてビルドする。

## 初回セットアップ
VPS の `/opt/briefing-bot` で：
```bash
git pull
bash deploy/multi-app/setup-portal.sh
```
これで `/` にポータル、`/briefing` にブリーフィングが出ます。

---

## 新しいアプリの足し方（3ステップ）

### 例：Next.js アプリ `myapp` を `/myapp`・ポート3001 で追加

**① アプリを配置して起動**
```bash
# 例: リポジトリを /opt/myapp に置く
cd /opt/myapp
npm ci
# basePath は build と start の両方で必要。export して両方に効かせる。
export NEXT_BASE_PATH=/myapp
npm run build
pm2 start npm --name myapp -- run start -- -p 3001
pm2 save
```
> ※ `next start` は起動時に next.config を再評価するので、`NEXT_BASE_PATH` を
> pm2 プロセスの環境にも入れること（`export` 済みのシェルから `pm2 start` する）。
> Next.js 以外（素のWebサーバ等）でも、`/myapp` 配下で動き、3001番で待ち受ければOK。

**② nginx にブロックを1つ追記**
`/etc/nginx/sites-available/portal` を編集し、`/briefing` のブロックの下にコピペ：
```nginx
location ^~ /myapp {
    proxy_pass http://127.0.0.1:3001;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_cache_bypass $http_upgrade;
}
```
反映：
```bash
nginx -t && systemctl reload nginx
```

**③ ポータルにカードを1枚追加**
`/var/www/portal/index.html` の `APPS` 配列に追記（`status:"live"` で有効化）：
```js
{
  name: "My App",
  desc: "説明文。",
  path: "/myapp",
  emoji: "🧩",
  status: "live",
},
```
保存すればトップに出ます（ブラウザ再読み込み）。

---

## ポート割り当てメモ（管理用）
| パス | ポート | アプリ | 状態 |
|------|--------|--------|------|
| /briefing | 3000 | 業界ブリーフィングBot | live |
| /（例）   | 3001 | （空き） | - |
| /（例）   | 3002 | （空き） | - |

## 注意
- **basePath はビルド時とランタイム両方で `NEXT_BASE_PATH` が必要**。
  `next start` は起動時に `next.config.mjs` を再評価するため、ビルドだけでなく
  **pm2 で `next start` を動かすプロセスの環境変数**にも入れること。
  `setup-portal.sh` は `export NEXT_BASE_PATH=/briefing` した上で
  `pm2 start npm ... -- run start` でプロセスを作り直し、`pm2 save` で保存する。
  （`.env.local` に入れるだけでは `next start` の config 評価に反映されない点に注意）
- HTTP公開のため、IPを知る誰でもアクセス可能。施錠したい場合は Basic認証・IP制限・独自ドメイン+HTTPS を検討。
