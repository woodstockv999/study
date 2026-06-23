#!/usr/bin/env bash
exec "$HOME/deploy/auto-deploy.sh" \
  "briefing-bot" \
  "$HOME/briefing-bot" \
  "briefing-bot" \
  "npm ci && NEXT_BASE_PATH=/briefing npm run build" \
  "http://210.131.212.62/briefing"
