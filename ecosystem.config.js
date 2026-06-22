// pm2 プロセス定義（VPS 常駐用）
//   起動: pm2 start ecosystem.config.js
//   ※ next start は package.json の "start" を使用。事前に `npm run build` 済みであること。
module.exports = {
  apps: [
    {
      name: "briefing-bot",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3000",
      cwd: __dirname,
      instances: 1,
      autorestart: true,
      max_memory_restart: "1G", // VPS 2GB 向けの安全弁
      env: {
        NODE_ENV: "production",
        // next start は起動時に next.config.mjs を再評価するため、
        // ビルドと同じ NEXT_BASE_PATH を runtime にも渡す必要がある。
        NEXT_BASE_PATH: "/briefing",
        // .env.local も Next.js が読み込むが、pm2 で明示したい場合はここに追加:
        // LLM_PROVIDER: "cli",
        // CLAUDE_MODEL: "claude-sonnet-4-6",
        // CLAUDE_HOME: "/root",
      },
    },
  ],
};
