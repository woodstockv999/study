#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
#  マルチアプリ受け皿セットアップ（ポータル + nginx パス振り分け）
#  既存の briefing-bot（:3000）を /briefing 配下に載せ替え、
#  / に選択ポータルを出す。何度流しても安全（冪等）。
#
#  使い方（VPS の /opt/briefing-bot で）:
#    bash deploy/multi-app/setup-portal.sh
# ─────────────────────────────────────────────────────────────
set -euo pipefail

REPO_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
PORTAL_SRC="$REPO_DIR/deploy/multi-app/portal"
PORTAL_DEST="/var/www/portal"
NGINX_SRC="$REPO_DIR/deploy/multi-app/nginx-portal.conf"

echo "==> nginx を確認"
command -v nginx >/dev/null 2>&1 || apt-get install -y nginx

echo "==> ポータルHTMLを配置: $PORTAL_DEST"
mkdir -p "$PORTAL_DEST"
cp -f "$PORTAL_SRC/index.html" "$PORTAL_DEST/index.html"

echo "==> nginx 設定を配置・有効化"
cp -f "$NGINX_SRC" /etc/nginx/sites-available/portal
ln -sf /etc/nginx/sites-available/portal /etc/nginx/sites-enabled/portal
# 旧・単体設定や初期設定が残っていれば外す
rm -f /etc/nginx/sites-enabled/briefing-bot
rm -f /etc/nginx/sites-enabled/default

echo "==> nginx 構文チェック & リロード"
nginx -t
systemctl reload nginx

echo "==> briefing-bot を /briefing 配下でビルド＆起動"
cd "$REPO_DIR"
# 重要: NEXT_BASE_PATH は build 時だけでなく `next start` 実行時の環境にも
# 必要（next start は実行時に next.config を再評価するため）。
# そのため export してビルドし、pm2 プロセスも作り直して env を確実に注入する。
export NEXT_BASE_PATH=/briefing
npm run build

echo "==> pm2 プロセスを ecosystem.config.js で作り直し（basePath を runtime に反映）"
pm2 delete briefing-bot >/dev/null 2>&1 || true
pm2 start ecosystem.config.js
pm2 save
# VPS 再起動後も自動起動するよう systemd に登録（初回のみ有効）
pm2 startup systemd -u root --hp /root 2>/dev/null | tail -1 | bash || true

cat <<'EOF'

============================================================
 マルチアプリ受け皿のセットアップ完了。

  ポータル:   http://<このVPSのIP>/
  ブリーフィング: http://<このVPSのIP>/briefing

 新しいアプリの足し方は deploy/multi-app/README.md を参照。
============================================================
EOF
