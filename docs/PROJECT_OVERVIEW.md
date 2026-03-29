# Claudex - Project Overview

## What is Claudex?

AIベースのSNSアカウント自動運用システム。クリプト(DeFi/DEX/NFT)関連の情報を日本のユーザー向けに発信し、リファーラル報酬で月収100万円を目指す。

### Persona

- **Name**: もち(@mochi_d3fi)
- **Concept**: DeFi初心者が学びをシェアする個人アカウント風
- **Target**: 日本のクリプト初心者~中級者
- **Language**: 日本語メイン

---

## Architecture

```
claudex/
├── src/
│   ├── index.ts                  # メインエントリポイント (スケジューラ起動、DeFiLlamaスキャン)
│   ├── core/
│   │   ├── types.ts              # Zod型定義 (Platform, Content, Card, Protocol, Schedule)
│   │   ├── config.ts             # 環境変数読み込み (dotenv + Zod validation)
│   │   ├── database.ts           # SQLite DB (better-sqlite3, WALモード)
│   │   ├── content-generator.ts  # Claude Haiku 4.5でSNS投稿文生成
│   │   ├── image-generator.ts    # Satori + Resvg でInstagram用画像生成
│   │   └── scheduler.ts          # node-cron投稿スケジューラ (JST, 40%確率/時)
│   ├── platforms/
│   │   ├── twitter.ts            # Twitter API v2 (tweet, thread, 280字制限)
│   │   ├── discord.ts            # discord.js (Embed投稿)
│   │   └── instagram.ts          # Instagram Graph API (画像投稿, カルーセル)
│   ├── scrapers/
│   │   └── defilama.ts           # DeFiLlama API (新プロトコル検出, リファーラル確認)
│   ├── monitoring/                # X (Twitter) データ収集システム
│   │   ├── types.ts              # Zod型定義 (CollectedTweet, MonitorRun, etc.)
│   │   ├── twitter-search.ts     # Twitter API v2 検索クライアント (Bearer Token)
│   │   ├── keyword-queries.ts    # 日次キーワード検索クエリ (5本)
│   │   ├── influencer-batcher.ts # 50アカウントを512文字制限内でバッチ化
│   │   ├── tweet-repository.ts   # SQLite CRUD + 重複排除 (INSERT OR IGNORE)
│   │   ├── monitor-runner.ts     # 検索オーケストレーション
│   │   ├── monitor-scheduler.ts  # node-cron (日次 + 月2回)
│   │   └── credit-tracker.ts     # API消費コスト推計・ログ
│   ├── data/
│   │   └── crypto-cards-japan.ts  # 日本向けクリプトカード7枚 (Tier1: 国内4枚, Tier2: 海外3枚)
│   ├── api/
│   │   ├── server.ts             # REST API (Node.js http, port 3001)
│   │   └── data.ts               # エアドロップキャンペーンデータ (10件, S/A/B tier)
│   └── dashboard/
│       └── index.html            # スタンドアロンHTML ダッシュボード (72KB, ダークテーマ)
├── scripts/                       # 各種CLIスクリプト
│   ├── verify-twitter.ts          # Twitter API接続確認
│   ├── verify-claude.ts           # Claude API接続確認
│   ├── scan-defilama.ts           # DeFiLlamaスキャン実行
│   ├── test-content.ts            # コンテンツ生成テスト
│   ├── test-image-gen.ts          # 画像生成テスト
│   ├── first-tweet.ts             # 初ツイート投稿
│   ├── post-tweet.ts              # ツイート投稿CLI
│   ├── generate-airdrop-tweets.ts # エアドロップツイート生成
│   ├── research-project.ts        # プロジェクトリサーチ
│   ├── serve-dashboard.ts         # ダッシュボード起動
│   ├── test-write.ts              # 書き込みテスト
│   └── run-monitor.ts             # 監視システムCLI (--keyword/--influencer/--both)
├── data/                          # SQLiteDB + 生成画像 + インフルエンサーJSON
│   └── airdrop-influencers.json   # 監視対象50名 (20 JP + 30 EN)
├── config/                        # (空)
├── templates/                     # (空)
└── tests/                         # (空)
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js + TypeScript (ESM) |
| Content Gen | Claude API (Haiku 4.5) |
| Image Gen | Satori + @resvg/resvg-js |
| DB | SQLite (better-sqlite3, WAL mode) |
| Scheduler | node-cron (JST timezone) |
| Validation | Zod |
| Twitter | twitter-api-v2 |
| Discord | discord.js v14 |
| Telegram | grammY (未実装) |
| Instagram | Graph API (fetch) |
| Data Source | DeFiLlama API (free) |
| Testing | Vitest |
| API Server | Node.js http (vanilla, no framework) |

---

## DB Schema (SQLite)

4テーブル:
1. **crypto_cards** - クリプトカード情報
2. **defi_protocols** - DeFiプロトコル情報
3. **scheduled_posts** - スケジュール投稿 (pending/approved/posted/failed)
4. **post_analytics** - 投稿分析 (impressions, engagements, clicks, referral_signups)

---

## API Endpoints (port 3001)

| Endpoint | Description |
|----------|-------------|
| GET /api/health | ヘルスチェック |
| GET /api/campaigns | アクティブキャンペーン一覧 |
| GET /api/campaigns/all | 全キャンペーン (終了含む) |
| GET /api/campaigns/:id | キャンペーン詳細 |

---

## Content Categories (7種)

1. **protocol_intro** - DeFiプロトコル紹介
2. **airdrop_alert** - エアドロップ速報
3. **defi_guide** - DeFi教育
4. **market_update** - 市場アップデート
5. **card_comparison** - クリプトカード比較
6. **referral_promo** - リファーラルプロモ (PR表記)
7. **engagement** - コミュニティ (Twitter+Instagramのみ)

---

## Airdrop Campaigns (data.ts)

10キャンペーン管理中:
- **S-tier**: edgeX (TGE 3/31), OpenSea ($423M raised), Polymarket ($20B volume)
- **A-tier**: Linea (ConsenSys), Eclipse (SVM L2), Hyperlane (bridge), Lighter (Perp DEX)
- **B-tier**: Phantom Wallet ($118M), Ambient Finance, Karak (restaking)

---

## Current Status (2026-03-29)

### Done
- Project structure (TypeScript + ESM)
- Core modules (config, DB, types, scheduler, content-gen, image-gen)
- Platform adapters (Twitter, Discord, Instagram)
- DeFiLlama scraper
- Crypto card data (7枚)
- Twitter/X API接続 (Read/Write)
- Claude API接続 (Haiku 4.5)
- Web dashboard (standalone HTML)
- REST API server
- Airdrop campaign data

### Pending
- Twitter投稿クレジット付与待ち
- Telegram Bot未セットアップ
- Discord Bot未セットアップ
- コンテンツ生成パイプライン
- 半自動承認フロー
- テスト (testsディレクトリ空)

---

## Revenue Model

DeFiプロトコル + クリプトカードのリファーラル報酬:
- 最有力: KAST Card ($25/referral, 上限なし) - 日本対応要確認
- edgeX: 招待者ポイント1/5 + 手数料30%還元
- その他: 各プロトコルのリファーラルプログラム

---

## Key Rules

- PR表記必須 (promotional content)
- DYOR (Do Your Own Research) disclaimer必須
- NFA (Not Financial Advice)
- 投稿は人間らしく (bot感を出さない)
- 1日0~5回投稿
- Immutable data patterns
