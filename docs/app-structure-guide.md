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

- `app/api/briefing/route.ts` — ブリーフィング生成
- `app/api/quiz/route.ts` — クイズ生成
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
   └─ プロンプトを組み立てる（lib/prompts.ts）
   └─ ndjsonHeartbeat() を開始
      └─ ストリーミング応答（接続は維持したまま）を返す
      └─ 10秒ごとに {"type":"ping"} を送り続ける（接続が切れないように）

4. lib/llm/cli.ts
   └─ claude -p --allowedTools WebSearch ... をサブプロセスで起動
   └─ プロンプトをstdinで渡す
   └─ ClaudeがWeb検索しながら記事を生成（30〜60秒かかる）
   └─ 結果をstdout（JSON形式）で受け取る

5. Next.js
   └─ {"type":"result","data":{"text":"...記事..."}} を送信
   └─ ストリームを閉じる

6. ブラウザ（lib/config.ts の postStream()）
   └─ "ping"行は無視し続ける
   └─ "result"行が来たらtextを取り出す
   └─ localStorageに保存
   └─ 画面に表示
```

---

## なぜ「ストリーミング」が必要なの？

Claude＋Web検索は**30〜60秒かかります**。普通のHTTP通信では、サーバーが返答を完全に作り終わるまでブラウザは待ち続けます。

問題：iOSのSafariは「何も返ってこない接続」を**約60秒で強制切断**します（"Load failed"エラー）。

解決策：応答ヘッダだけ先に送り、処理中は**10秒ごとに`{"type":"ping"}`という「生きてるよ」信号**を送り続けます。処理が終わったら`{"type":"result",...}`を送ります。これが`lib/stream.ts`の`ndjsonHeartbeat()`関数の仕事です。

```
time  0s  ─▶ HTTP 200 OK（ヘッダ）送信  ← ブラウザ「接続OK」
time  0s  ─▶ {"type":"ping"}            ← ブラウザ「無視」
time 10s  ─▶ {"type":"ping"}            ← ブラウザ「無視」
time 20s  ─▶ {"type":"ping"}            ← ブラウザ「無視」
   ...        （Claudeが検索・生成中）
time 45s  ─▶ {"type":"result","data":{...}}  ← ブラウザ「表示！」
```

このデータ形式（1行1JSON）を **NDJSON**（Newline Delimited JSON）と呼びます。

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
│       ├── briefing/route.ts   ← ブリーフィング生成API
│       ├── quiz/route.ts       ← クイズ生成API
│       └── deepdive/route.ts   ← 用語深掘りAPI
├── lib/
│   ├── config.ts               ← postStream()（ブラウザ側受信）
│   ├── stream.ts               ← ndjsonHeartbeat()（サーバー側送信）
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
