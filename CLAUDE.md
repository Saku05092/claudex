# Claudex - AI-Powered Crypto SNS Account Management System

## Project Goal

AIベースでSNSアカウント(Twitter/X, Discord, Telegram, Instagram)を自動運用し、クリプト(DeFi/DEX/NFT)関連の情報を日本のユーザー向けに発信する。リファーラルによる収益獲得を通じて**月収100万円**を目標とする。

### Core Strategy

- **ペルソナ**: もち(@mochi_d3fi) - DeFi初心者が学びをシェアする個人アカウント風
- **ターゲット**: 日本のクリプト初心者~中級者
- **収益モデル**: DeFiプロトコル・クリプトカードのリファーラル報酬
- **コンテンツ**: テキスト+リンク(Instagram向けはテキスト→画像変換)
- **言語**: 日本語メイン、英語もOK
- **投稿頻度**: 1日0~5回(人間らしさを重視)
- **自動化**: 半自動 → 全自動へ段階的移行

---

## Tech Stack

- **Runtime**: Node.js + TypeScript (ESM)
- **Content Generation**: Claude API (Haiku 4.5)
- **Image Generation**: Satori + @resvg/resvg-js (Instagram用)
- **Database**: SQLite (better-sqlite3)
- **Scheduler**: node-cron (JST対応)
- **Platforms**: twitter-api-v2, discord.js, grammY, Instagram Graph API
- **Data Source**: DeFiLlama API, Twitter Search API
- **Web Dashboard**: Standalone HTML (SPA, hash routing)
- **API Server**: HTTP (port 3001, CORS enabled)

---

## Implemented Modules

### Core
| Module | File | Status |
|---|---|---|
| Config (env vars) | src/core/config.ts | Done |
| Database (SQLite) | src/core/database.ts | Done |
| Types | src/core/types.ts | Done |
| Scheduler (node-cron) | src/core/scheduler.ts | Done |
| Content Generator (Claude API) | src/core/content-generator.ts | Done |
| Content Templates (7 categories) | src/core/content-templates.ts | Done |
| Airdrop Tweet Patterns (5 patterns) | src/core/airdrop-tweet-patterns.ts | Done |
| Image Generator (Satori+Resvg) | src/core/image-generator.ts | Done |
| Project Researcher (DeFiLlama+Claude) | src/core/project-researcher.ts | Done |
| Dashboard Publisher (auto HTML edit) | src/core/dashboard-publisher.ts | Done |
| Content Pipeline (draft->approve->post) | src/core/content-pipeline.ts | Done |
| Multi-Poster (concurrent multi-platform) | src/core/multi-poster.ts | Done |
| Referral Manager (UTM+URL validation) | src/core/referral-manager.ts | Done |
| Carousel Pipeline (Instagram slides) | src/core/carousel-pipeline.ts | Done |
| Post History (analytics+stats) | src/core/post-history.ts | Done |

### API
| Module | File | Status |
|---|---|---|
| REST API Server (:3001) | src/api/server.ts | Done |
| Campaign Data (single source of truth) | src/api/data.ts | Done |

### Monitoring (Twitter Search)
| Module | File | Status |
|---|---|---|
| Twitter Search Client | src/monitoring/twitter-search.ts | Done |
| Tweet Repository (SQLite) | src/monitoring/tweet-repository.ts | Done |
| Tweet Analyzer | src/monitoring/tweet-analyzer.ts | Done |
| Monitor Runner | src/monitoring/monitor-runner.ts | Done |
| Monitor Scheduler | src/monitoring/monitor-scheduler.ts | Done |
| Keyword Queries | src/monitoring/keyword-queries.ts | Done |
| Influencer Batcher | src/monitoring/influencer-batcher.ts | Done |
| Credit Tracker | src/monitoring/credit-tracker.ts | Done |

### Discovery
| Module | File | Status |
|---|---|---|
| Discovery Pipeline | src/discovery/discovery-pipeline.ts | Done |
| Campaign Evaluator | src/discovery/campaign-evaluator.ts | Done |
| Campaign Repository | src/discovery/campaign-repository.ts | Done |

### Platforms
| Module | File | Status |
|---|---|---|
| Twitter (post/thread) | src/platforms/twitter.ts | Done |
| Discord (embed post) | src/platforms/discord.ts | Done |
| Discord Pipeline (commands) | src/platforms/discord-pipeline.ts | Done |
| Telegram (channel/bot) | src/platforms/telegram.ts | Done |
| Instagram (image/carousel) | src/platforms/instagram.ts | Done |

### Scrapers
| Module | File | Status |
|---|---|---|
| DeFiLlama (protocol detection) | src/scrapers/defilama.ts | Done |
| Airdrop Scanner (referral check) | src/scrapers/airdrop-scanner.ts | Done |

### Data
| Module | File | Status |
|---|---|---|
| Airdrop Influencers (54 accounts) | src/data/airdrop-influencers.ts | Done |
| Airdrop Opportunities (13 entries) | src/data/airdrop-opportunities.ts | Done |
| Crypto Cards Japan (7 cards) | src/data/crypto-cards-japan.ts | Done |

### Dashboard (Web SPA)
| Feature | Status |
|---|---|
| Airdrop Navigator (top page) | Done |
| Campaign Detail (#/airdrop/{id}) | Done |
| Card Comparison (#/cards) | Done |
| CTA + Referral Links | Done |
| Tier S/A/B/C with TGE flags | Done |

---

## CLI Scripts

```bash
# API Server
npm run api                                    # Start API server (:3001)
npm run api:dev                                # Watch mode

# Dashboard
npx tsx scripts/serve-dashboard.ts             # Serve dashboard (:3000)

# Twitter
npx tsx scripts/post-tweet.ts engagement       # Post engagement tweet
npx tsx scripts/post-tweet.ts educational "topic"
npx tsx scripts/post-tweet.ts airdrop_experience
npx tsx scripts/post-tweet.ts airdrop_roundup
npx tsx scripts/post-tweet.ts news             # News-based tweet
npx tsx scripts/post-tweet.ts --dry            # Preview only

# Research Pipeline
npx tsx scripts/research-project.ts "Pendle"   # Research only
npx tsx scripts/research-project.ts "Pendle" --publish  # Research + add to dashboard

# Monitoring
npx tsx scripts/run-monitor.ts                 # Run Twitter monitoring
npx tsx scripts/run-discovery.ts               # Run discovery pipeline

# Data
npx tsx scripts/scan-defilama.ts               # Scan new DeFi protocols
npx tsx scripts/generate-airdrop-tweets.ts     # Generate all 5 tweet patterns
npx tsx scripts/test-image-gen.ts              # Generate Instagram images

# Verification
npx tsx scripts/verify-twitter.ts              # Check Twitter API
npx tsx scripts/verify-claude.ts               # Check Claude API
```

---

## SNS Accounts

| Platform | Account | Status |
|---|---|---|
| Twitter/X | @mochi_d3fi | Active (5 tweets posted) |
| Telegram | 未作成 | Pending |
| Discord | 未作成 | Pending |
| Instagram | 未作成 | Pending |

---

## API Endpoints

| Method | Path | Description |
|---|---|---|
| GET | /api/health | Service status |
| GET | /api/campaigns | Active campaigns (10) |
| GET | /api/campaigns/all | All campaigns |
| GET | /api/campaigns/:id | Single campaign |
| GET | /api/monitor | Monitoring dashboard |
| GET | /api/monitor/stats | Tweet monitoring stats |
| GET | /api/monitor/trending | Trending projects |
| GET | /api/monitor/influencers | Top influencers |
| GET | /api/monitor/tweets | Recent tweets |
| POST | /api/monitor/run/keyword | Run keyword search |
| POST | /api/monitor/run/influencer | Run influencer search |
| POST | /api/monitor/run/both | Run both |
| POST | /api/discovery/run/tweet | Discovery from tweets |
| POST | /api/discovery/run/defilama | Discovery from DeFiLlama |
| POST | /api/discovery/run/all | Run all discovery |

---

## Implementation Phases & Progress

### Phase 0: Foundation [COMPLETED]
- [x] GitHub repository作成
- [x] プロジェクト構造構築 (TypeScript + ESM)
- [x] Core modules: config, database, types, scheduler
- [x] Platform adapters: Twitter, Discord, Telegram, Instagram
- [x] DeFiLlama scraper
- [x] クリプトカードデータ (日本向け7枚)

### Phase 1: API Integration & Testing [COMPLETED]
- [x] Twitter/X API接続 (Read/Write, Pay-Per-Use $5)
- [x] Claude API接続 (Haiku 4.5)
- [x] DeFiLlamaスキャン実行
- [x] コンテンツ生成テスト (日本語)
- [x] Instagram画像生成テスト (Satori + Resvg)
- [x] Webダッシュボード (SPA, エアドロ+カード比較)
- [x] コンテンツ戦略・テンプレート (7カテゴリ)
- [x] 初ツイート投稿 (@mochi_d3fi, 5件)
- [x] エアドロップツイートパターン (5パターン)
- [x] プロジェクト調査パイプライン (研究→評価→ダッシュボード自動追加)
- [x] AirHunt API連携 (REST API :3001)
- [x] Twitter Monitoring (キーワード+インフルエンサー検索)
- [x] Discovery Pipeline (ツイート→評価→キャンペーン登録)
- [ ] Telegram Bot セットアップ
- [ ] Discord Bot セットアップ

### Phase 2: Content Pipeline & Semi-Auto Posting [COMPLETED]
- [x] コンテンツ生成パイプライン (テンプレート→Claude API→投稿)
- [x] 投稿スクリプト (post-tweet.ts, 複数パターン)
- [x] 半自動承認フロー (generate→list→approve→post ワークフロー)
- [x] マルチプラットフォーム同時投稿 (multi-poster.ts, Promise.allSettled)
- [x] リファーラルリンク管理システム (UTMビルド、URL検証、SQLite永続化)
- [x] Instagram カルーセル画像自動生成 (Satori+Resvg, 4スライド)
- [x] 投稿履歴・分析DB (recordPost, getPostStats, getPostsByDate)
- [ ] note.comブログ連携

### Phase 3: Web Dashboard Enhancement [NOT STARTED]
- [ ] ドメイン取得・デプロイ (Vercel or Cloudflare Pages)
- [ ] リファーラルトラッキング (UTM)
- [ ] Linktree/link-in-bio ページ
- [ ] SEO最適化
- [ ] カード比較リアルタイム更新
- [ ] ユーザーレビュー機能

### Phase 4: Full Automation & Scaling [NOT STARTED]
- [ ] 投稿の完全自動化 (承認フロー不要)
- [ ] A/Bテスト
- [ ] フォロワー成長分析
- [ ] 新規リファーラルプログラム自動検出
- [ ] クラウド移行 (Railway)
- [ ] 収益ダッシュボード

---

## Monthly Cost

| Item | Current | Scaled |
|---|---|---|
| Twitter/X API (Pay-Per-Use) | ~$0.04 (5 tweets) | ~$1/月 |
| Claude API (Haiku) | ~$10 | ~$50 |
| Domain | $0 | ~$12/年 |
| Hosting | $0 | $20 |
| **Total** | **~$10/月** | **~$70/月** |

---

## Key Rules

- All promotional content must be marked as **PR**
- All posts must include **DYOR** disclaimer
- Never provide financial advice (NFA)
- Follow each platform's automation policies
- Content must feel natural and personal (not bot-like)
- No emojis in code or documentation
- Immutable data patterns
