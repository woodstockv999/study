#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
#  業界ブリーフィング Bot  — Xserver VPS セットアップスクリプト
#  対象: Ubuntu 24.04 / root
#  使い方（VPS 上で root として実行）:
#    bash deploy/setup-vps.sh
#  事前に GIT_REPO を環境に合わせて編集すること。
# ─────────────────────────────────────────────────────────────
set -euo pipefail

# === 設定（必要に応じて変更） ===================================
APP_DIR="/opt/briefing-bot"
GIT_REPO="${GIT_REPO:-https://github.com/woodstockv999/study.git}"
GIT_BRANCH="${GIT_BRANCH:-claude/xserver-vps-setup-zzr5g7}"
NODE_MAJOR="22"
APP_PORT="3000"
# ===============================================================

echo "==> apt パッケージ更新"
apt-get update -y
apt-get install -y curl git ufw

echo "==> Node.js ${NODE_MAJOR}.x インストール"
if ! command -v node >/dev/null 2>&1 || [ "$(node -v | cut -d. -f1 | tr -d v)" -lt "$NODE_MAJOR" ]; then
  curl -fsSL "https://deb.nodesource.com/setup_${NODE_MAJOR}.x" | bash -
  apt-get install -y nodejs
fi
node -v && npm -v

echo "==> pm2 インストール（プロセス常駐・自動再起動）"
npm install -g pm2

echo "==> Claude Code (CLI) インストール ※ LLM_PROVIDER=cli で使用"
npm install -g @anthropic-ai/claude-code || true
echo "   → 後で必ず 'claude' に一度ログインすること（下記の注意参照）"

echo "==> リポジトリ取得"
if [ -d "$APP_DIR/.git" ]; then
  git -C "$APP_DIR" fetch origin "$GIT_BRANCH"
  git -C "$APP_DIR" checkout "$GIT_BRANCH"
  git -C "$APP_DIR" pull origin "$GIT_BRANCH"
else
  git clone --branch "$GIT_BRANCH" "$GIT_REPO" "$APP_DIR"
fi
cd "$APP_DIR"

echo "==> 依存インストール & ビルド"
npm ci || npm install
npm run build

echo "==> 環境変数ファイル（.env.local）"
if [ ! -f "$APP_DIR/.env.local" ]; then
  cp "$APP_DIR/.env.local.example" "$APP_DIR/.env.local"
  echo "   → .env.local を作成しました。LLM_PROVIDER / キーを確認してください。"
fi

echo "==> ファイアウォール（任意：80/443 を開け、3000 は localhost のみ想定）"
ufw allow OpenSSH || true
ufw allow 80/tcp || true
ufw allow 443/tcp || true
# 直接 3000 を公開する場合は次行を有効化（リバプロを使うなら不要）
# ufw allow ${APP_PORT}/tcp || true
yes | ufw enable || true

echo "==> pm2 で起動"
pm2 delete briefing-bot >/dev/null 2>&1 || true
pm2 start npm --name briefing-bot -- run start
pm2 save
pm2 startup systemd -u root --hp /root | tail -1 | bash || true

echo ""
echo "============================================================"
echo " セットアップ完了。"
echo "  - アプリ: http://<このVPSのIP>:${APP_PORT}  (リバプロ未設定時)"
echo "  - ログ:   pm2 logs briefing-bot"
echo ""
echo " 【重要】LLM_PROVIDER=cli（既定）の場合:"
echo "   root で一度 'claude' を起動し Pro/Max サブスクでログインしてください。"
echo "   ログイン情報は ~/.claude に保存され、pm2 の子プロセスから利用されます。"
echo ""
echo " 【重要】LLM_PROVIDER=api に切り替える場合:"
echo "   .env.local に ANTHROPIC_API_KEY=... を設定し 'pm2 restart briefing-bot'"
echo "============================================================"
