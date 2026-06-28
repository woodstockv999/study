# briefing-bot

- PM2 名: `briefing-bot` / ポート: 3000
- nginx: `/briefing`

## デプロイ

```bash
git pull && npm run build && pm2 restart briefing-bot && pm2 save
```
