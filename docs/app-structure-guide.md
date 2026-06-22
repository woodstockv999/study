# 業界ブリーフィング Bot — アプリ構成の解説

## このアプリは何をするもの？

担当業界の最新トレンドを、Claude（AI）がWeb検索して毎日まとめてくれるツールです。
スマートフォンのブラウザから開いて「ブリーフィングを生成」ボタンを押すだけで、Markdownの記事が届きます。クイズや用語深掘りも同じAIが作ります。

---

## 全体像（登場人物と役割）

```
┌─────────────┐     ①リクエスト      ┌─────────────┐
│   あなたの   │ ──────────────────▶ │    nginx    │
│  スマホ/PC  │                      │（玄関係）    │
│  ブラウザ   │ ◀────────────────── │             │
└─────────────┘     ④結果を返す      └──────┬──────┘
                                              │ ②転送
                                              ▼
                                     ┌─────────────┐     ③AIに聞く
                                     │  Next.js    │ ────────────▶ Claude CLI
                                     │（アプリ本体）│              （AI本体）
                                     └─────────────┘
```

登場人物は4つです。順番に説明します。

---

## 登場人物① ブラウザ（フロントエンド）

**ファイル:** `app/page.tsx`、`app/components/` 以下

ブラウザ上に表示される「画面」の部分です。**React**（Webアプリを作るライブラリ）を使って書かれています。

ブラウザがやっていること：

- 業界の選択、レベル選択、ボタンのクリックを受け付ける
- 「ブリーフィングを生成」を押すと、**自分たちのサーバーに**リクエストを送る（AI会社に直接送るのではなく、自分のVPSに送る）
- 結果が返ってきたらMarkdownで画面に表示する
- 履歴をブラウザの**localStorage**（そのスマホ/PC内だけに保存される倉庫）に保存する

ポイント：**履歴はそのブラウザ内にしか存在しません。** 他の端末では見えませんし、サーバーにも保存されていません。

---

## 登場人物② nginx（玄関係）

**ファイル:** `deploy/nginx-portal.conf`

あなたのVPSサーバーへのリクエストを最初に受け取る「受付係」です。

```
ブラウザから来たリクエスト
  /briefing/...  →  port 3000（Next.jsアプリ）に転送
  /              →  /var/www/portal（選択ポータル）を返す
```

一台のVPSで複数のアプリを動かすために、URLのパスで振り分けています。
`/briefing` で始まるURLはすべてNext.jsアプリ（port 3000）に回します。

---

## 登場人物③ Next.js（アプリ本体・サーバー）

**主要ファイル:**

- `app/api/briefing/route.ts` — ブリーフィング生成（バックグラウンドジョブ起動）
- `app/api/briefing/status/route.ts` — ブリーフィング生成の進捗確認
- `app/api/quiz/route.ts` — クイズ生成（バックグラウンドジョブ起動）
- `app/api/quiz/status/route.ts` — クイズ生成の進捗確認
- `app/api/deepdive/route.ts` — 用語深掘り

Next.jsは「フロントエンド（画面）とバックエンド（サーバー処理）を同時に書けるフレームワーク」です。
このアプリでは**サーバー側のAPIエンドポイント**として動き、ブラウザからのリクエストを受け取ってClaudeを呼び出します。

**pm2**（`ecosystem.config.js`）というツールで常駐させています。VPSを再起動しても自動的に立ち上がります。

---

## 登場人物④ Claude CLI（AI本体）

**ファイル:** `lib/llm/cli.ts`、`lib/llm/api.ts`

実際に文章を生成するAIです。2つの呼び出し方があり、環境変数 `LLM_PROVIDER` で切り替えます。

| 設定値 | 呼び方 | 料金 |
|---|---|---|
| `cli`（既定） | VPSに入れた`claude`コマンドを直接実行 | Claude Pro/Max サブスク内で無料 |
| `api` | Anthropic APIをSDK経由で呼び出す | API従量課金 |

CLIモードでは、Node.jsが `claude -p`（ワンショット実行）コマンドをVPS上でサブプロセスとして起動します。`--allowedTools WebSearch` オプションをつけることで、ClaudeがWeb検索を使えるようになります。

---

## 「ブリーフィングを生成」を押したときの流れ（詳細）

```
1. ブラウザ
   └─ POST /briefing/api/briefing
      { industry: "IT・ソフトウェア", level: "実務" }

2. nginx
   └─ /briefing/api/* → port 3000 へ転送

3. Next.js（app/api/briefing/route.ts）
   └─ ジョブを1つ作成（lib/jobs.ts のインメモリストア）
   └─ すぐに { jobId } を返す（接続はここで一旦切れてOK）
   └─ 裏でプロンプトを組み立て（lib/prompts.ts）、Claude を呼び出す
      （ブラウザ＝Safariを閉じても、この処理はサーバー側で動き続ける）

4. lib/llm/cli.ts
   └─ claude -p --allowedTools WebSearch ... をサブプロセスで起動
   └─ プロンプトをstdinで渡す
   └─ ClaudeがWeb検索しながら記事を生成（30〜60秒かかる）
   └─ 結果をstdout（JSON形式）で受け取る
   └─ 完了したらジョブに結果を保存（status: "done"）

5. ブラウザ（lib/config.ts の pollJob()）
   └─ jobId を localStorage に保存
   └─ 3秒おきに GET /briefing/api/briefing/status?jobId=... を叩く
   └─ status が "done" になったら data.text を取り出す
   └─ localStorageに保存して画面に表示
   （Safariを閉じて開き直しても、保存した jobId で続きから確認できる）
```

クイズ生成も同じ仕組みです（`/api/quiz` でジョブ起動 →
`/api/quiz/status` でポーリング）。

---

## なぜ「バックグラウンドジョブ」方式なの？

Claude＋Web検索は**30〜60秒かかります**。普通のHTTP通信では、サーバーが
返答を完全に作り終わるまでブラウザは接続を保ったまま待ち続けます。

問題：iOSのSafariは、長い処理の途中でアプリを閉じたりバックグラウンドに
回したりすると**接続を強制切断**します（"Load failed"エラー）。せっかく
生成中だった内容も失われてしまいます。

解決策：**処理本体とHTTP接続を切り離します**。

1. POSTを受けたら、すぐに `jobId` だけ返して接続を閉じる。
2. 実際の生成はサーバー側で動き続ける（接続が切れても止まらない）。
3. ブラウザは別リクエストで「終わった？」と定期的に聞きに行く
   （ポーリング）。

これなら途中でSafariを閉じても処理は継続し、開き直したときに
localStorage に残した `jobId` で結果を回収できます。ジョブの保管は
`lib/jobs.ts`（1時間で自動失効するインメモリストア）が担当します。

```
[POST] 0s  ─▶ { jobId: "abc" } を即返却 → 接続クローズ
              （以降、サーバーは裏でClaudeを実行中）
[GET]  3s  ─▶ status?jobId=abc → { status: "pending" }
[GET]  6s  ─▶ status?jobId=abc → { status: "pending" }
   ...        （Claudeが検索・生成中。Safariを閉じてもOK）
[GET] 45s  ─▶ status?jobId=abc → { status: "done", data:{...} } ← 表示！
```

> 用語深掘り（`/api/deepdive`）だけは短時間で終わり、画面を開いたまま
> 使う想定のため、従来の NDJSON ハートビート方式（`lib/stream.ts` の
> `ndjsonHeartbeat()`、10秒ごとに `{"type":"ping"}` を送って接続を保つ）
> を使っています。

---

## ファイル構成の全体マップ

```
study/
├── app/
│   ├── page.tsx                ← 画面全体（React）
│   ├── layout.tsx              ← 共通レイアウト
│   ├── components/
│   │   ├── IndustryPicker.tsx  ← 業界・レベル選択UI
│   │   ├── BriefingView.tsx    ← 生成結果の表示・深掘り入力
│   │   ├── Quiz.tsx            ← クイズUI
│   │   ├── HistorySidebar.tsx  ← 履歴サイドバー
│   │   └── Markdown.tsx        ← Markdown→HTML変換
│   └── api/
│       ├── briefing/route.ts        ← ブリーフィング生成API（ジョブ起動）
│       ├── briefing/status/route.ts ← ブリーフィング進捗確認API
│       ├── quiz/route.ts            ← クイズ生成API（ジョブ起動）
│       ├── quiz/status/route.ts     ← クイズ進捗確認API
│       └── deepdive/route.ts        ← 用語深掘りAPI
├── lib/
│   ├── config.ts               ← startJob()/pollJob()（ジョブ起動・進捗確認）, postStream()
│   ├── jobs.ts                 ← バックグラウンドジョブのインメモリストア
│   ├── stream.ts               ← ndjsonHeartbeat()（deepdive用・サーバー側送信）
│   ├── prompts.ts              ← Claudeへの指示文（プロンプト）
│   ├── storage.ts              ← localStorage操作
│   └── llm/
│       ├── index.ts            ← CLIかAPIか振り分け
│       ├── cli.ts              ← claude コマンド実行
│       ├── api.ts              ← Anthropic SDK呼び出し
│       └── types.ts            ← 型定義
├── deploy/
│   ├── nginx-briefing-bot.conf ← nginx設定（単独運用）
│   ├── setup-vps.sh            ← VPS初期セットアップ
│   └── multi-app/
│       ├── nginx-portal.conf   ← nginx設定（マルチアプリ）
│       ├── setup-portal.sh     ← マルチアプリ切替スクリプト
│       └── portal/index.html   ← / のポータル画面
├── ecosystem.config.js         ← pm2設定（常駐プロセス管理）
├── next.config.mjs             ← Next.js設定（basePath等）
└── .env.local                  ← 環境変数（LLM_PROVIDER等）
```

---

## 環境変数（.env.local）の読み方

```
LLM_PROVIDER=cli           # "cli"=CLIモード / "api"=APIモード
ANTHROPIC_API_KEY=         # apiモードのときだけ必要
CLAUDE_BIN=claude          # claudeコマンドのパス（通常は変更不要）
CLAUDE_HOME=/root          # claude認証情報の場所（pm2で動かす場合に指定）
CLAUDE_MODEL=claude-sonnet-4-6  # 使用するモデル名
```

---

## まとめ：データの旅

```
あなた
 ↓「ブリーフィング生成」クリック
ブラウザ（React）
 ↓ POST /briefing/api/briefing
nginx（玄関）
 ↓ port 3000に転送
Next.js（サーバー）
 ↓ プロンプト組み立て＆ストリーミング開始
Claude CLI
 ↓ Web検索しながら記事生成（30〜60秒）
Next.js
 ↓ {"type":"result",...} 送信
ブラウザ
 ↓ localStorageに保存＆画面に表示
あなた
 「記事が届いた！」
```
