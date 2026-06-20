# 業界ブリーフィング Bot

コンサルタントが「担当業界のトレンド・用語・論点を毎日5分でキャッチアップする」ための個人用ブリーフィング Web アプリ。

業界とレベルを選ぶと、Claude が **Web 検索** で当日のトレンドを集めて要点を解説。解説後に **理解度チェッククイズ**、用語の **深掘り**、過去分の **履歴保存（localStorage）** が使えます。iPhone を含む任意のデバイスからブラウザでアクセスできます。

---

## 1. 技術スタック

| 項目 | 内容 |
|---|---|
| フレームワーク | Next.js (App Router) + TypeScript |
| スタイリング | Tailwind CSS |
| AI | Claude（後述の 2 プロバイダから選択） |
| モデル | `claude-sonnet-4-6` |
| Web 検索 | CLI: Claude Code の WebSearch / API: `web_search_20250305` |
| 状態保存 | localStorage（履歴・設定） |
| パッケージ管理 | npm |

---

## 2. ⚙️ LLM バックエンドは 2 通り（重要な設計判断）

仕様書は Anthropic **API**（従量課金）を指定していますが、依頼者の希望「**API ではなく Claude チャット（Pro サブスク）経由が望ましい**」を両立させるため、`LLM_PROVIDER` 環境変数で切り替えられる構成にしました。API ルートは共通インターフェイス `lib/llm` だけを呼び、裏側のプロバイダを意識しません。

| `LLM_PROVIDER` | 中身 | 課金 | 用途 |
|---|---|---|---|
| **`cli`（既定・VPS 推奨）** | 端末の `claude` を headless 実行（`claude -p`）。Claude **Pro/Max サブスク認証**。WebSearch を使用 | **API 従量課金なし** | Xserver VPS |
| `api` | `@anthropic-ai/sdk` + `web_search_20250305` ツール | API キー従量課金 | Vercel など |

> `cli` は VPS 上に Claude Code がインストールされ、サブスクでログイン済みであることが前提です。
> Vercel のようなサーバーレス環境では `claude` を常駐させられないため、Vercel では `api` を使ってください。

---

## 3. ローカル開発（`npm run dev`）

```bash
npm install
cp .env.local.example .env.local   # 中身を編集
npm run dev                        # http://localhost:3000
```

### `.env.local` の設定

**A. サブスク経由（API キー不要）**
```env
LLM_PROVIDER=cli
CLAUDE_MODEL=claude-sonnet-4-6
```
事前に端末で `claude` に一度ログインしておくこと（`claude` を起動して指示に従う）。

**B. API キー経由**
```env
LLM_PROVIDER=api
ANTHROPIC_API_KEY=sk-ant-...
CLAUDE_MODEL=claude-sonnet-4-6
```
API キーは [Anthropic Console](https://console.anthropic.com/) → API Keys で取得。

> 🔐 API キーは **サーバー側（API ルート）でのみ** 使用され、ブラウザのバンドル／ネットワークタブには一切出ません。`.env.local` は `.gitignore` 済みでコミットされません。

---

## 4. 🚀 Xserver VPS へのデプロイ

対象 VPS（例）: Ubuntu 24.04 / `ssh root@210.131.212.62`

### 4-1. 自動セットアップ（推奨）

VPS に root で SSH し、次を実行：

```bash
# リポジトリを取得してスクリプトを実行
apt-get update -y && apt-get install -y git
git clone -b claude/xserver-vps-setup-zzr5g7 https://github.com/woodstockv999/study.git /opt/briefing-bot
cd /opt/briefing-bot
bash deploy/setup-vps.sh
```

`deploy/setup-vps.sh` が行うこと:
1. Node.js 22 / git / pm2 / Claude Code(CLI) のインストール
2. `npm ci && npm run build`
3. `.env.local` 雛形の作成
4. ufw 設定（22/80/443）
5. **pm2 でアプリを常駐**（`pm2 startup` で再起動後も自動起動）

### 4-2. 仕上げ（手動の最終確認）

```bash
# (cli プロバイダの場合) サブスクにログイン
claude            # 起動して一度ログイン → ~/.claude に保存される

# .env.local を確認・編集
nano /opt/briefing-bot/.env.local

# 反映
cd /opt/briefing-bot && pm2 restart briefing-bot
pm2 logs briefing-bot      # 動作ログ
```

### 4-3. 公開アクセス（iPhone を含む任意デバイス）

- **手早く試す**: `ufw allow 3000/tcp` して `http://210.131.212.62:3000` にアクセス。
- **推奨（HTTPS）**: 独自ドメインを VPS に向け、nginx + certbot で TLS 化。
  ```bash
  apt-get install -y nginx certbot python3-certbot-nginx
  cp deploy/nginx-briefing-bot.conf /etc/nginx/sites-available/briefing-bot
  ln -s /etc/nginx/sites-available/briefing-bot /etc/nginx/sites-enabled/
  nginx -t && systemctl reload nginx
  certbot --nginx -d your-domain.example
  ```
  以後 `https://your-domain.example` で iPhone Safari からも安全に利用できます。

### 4-4. 更新デプロイ

```bash
cd /opt/briefing-bot
git pull origin claude/xserver-vps-setup-zzr5g7
npm ci && npm run build
pm2 restart briefing-bot
```

---

## 5. Vercel へのデプロイ（任意・`api` プロバイダ専用）

1. このリポジトリを Vercel にインポート
2. Environment Variables に設定:
   - `LLM_PROVIDER=api`
   - `ANTHROPIC_API_KEY=sk-ant-...`
   - `CLAUDE_MODEL=claude-sonnet-4-6`
3. Deploy → 発行された公開 URL からアクセス

> Vercel では `cli` プロバイダは使えません（`claude` を常駐できないため）。必ず `api` を使用してください。Web 検索ツールは Anthropic Console 側で有効化が必要な場合があります。

---

## 6. ディレクトリ構成

```
app/
  page.tsx                 # メイン画面
  layout.tsx / globals.css
  api/
    briefing/route.ts      # ブリーフィング生成（Web検索）
    quiz/route.ts          # クイズ生成（JSON）
    deepdive/route.ts      # 用語深掘り
  components/
    IndustryPicker.tsx
    BriefingView.tsx
    Quiz.tsx
    HistorySidebar.tsx
    Markdown.tsx
lib/
  prompts.ts               # レベル別プロンプト組み立て
  storage.ts               # localStorage ラッパー
  llm/
    index.ts               # プロバイダ切替の単一エントリ generate()
    cli.ts                 # claude CLI（サブスク）プロバイダ
    api.ts                 # Anthropic API プロバイダ
    types.ts
deploy/
  setup-vps.sh             # VPS 一括セットアップ
  nginx-briefing-bot.conf  # リバースプロキシ例
ecosystem.config.js        # pm2 プロセス定義
.env.local.example
```

---

## 7. トラブルシューティング

| 症状 | 対処 |
|---|---|
| `claude CLI を起動できません` | VPS に Claude Code 未導入／未ログイン。`npm i -g @anthropic-ai/claude-code` → `claude` でログイン。pm2 配下で HOME が違う場合は `.env.local` に `CLAUDE_HOME=/root` |
| `ANTHROPIC_API_KEY が設定されていません` | `LLM_PROVIDER=api` なのにキー未設定。`.env.local` に設定し `pm2 restart` |
| Web 検索が動かない（api） | Anthropic Console で web search ツールの有効化が必要な場合あり |
| 生成が長い | Web 検索は数十秒かかります（仕様）。UI はスピナー＋「検索中…」を表示 |
| 履歴が消えた | 履歴はブラウザの localStorage に保存。別端末・別ブラウザには共有されません |

---

## 8. スコープ外（今回未対応）

ユーザー認証 / 外部 DB / 定期実行・メール配信 / 課金・利用量制限 UI。
