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
- **Database**: SQLite (better-sqlite3) → PostgreSQL (クラウド移行時)
- **Scheduler**: node-cron (JST対応)
- **Platforms**: twitter-api-v2, discord.js, grammY, Instagram Graph API
- **Data Source**: DeFiLlama API (無料)
- **Web Dashboard**: Standalone HTML (将来的にNext.js移行)

---

## Commands

```bash
npm run dev              # 開発モード起動
npm run build            # TypeScriptビルド
npm run typecheck        # 型チェック
npm run test             # テスト実行
npx tsx scripts/serve-dashboard.ts    # ダッシュボード起動 (localhost:3000)
npx tsx scripts/scan-defilama.ts      # DeFiLlamaスキャン
npx tsx scripts/verify-twitter.ts     # Twitter API接続確認
npx tsx scripts/verify-claude.ts      # Claude API接続確認
npx tsx scripts/test-image-gen.ts     # Instagram画像生成テスト
npx tsx scripts/test-content.ts       # コンテンツ生成テスト
npx tsx scripts/first-tweet.ts        # 初ツイート投稿
```

---

## SNS Accounts

| Platform | Account | Status |
|----------|---------|--------|
| Twitter/X | @mochi_d3fi (もち@DeFi触ってみた) | API接続済、投稿はクレジット付与待ち |
| Telegram | 未作成 (予定: @mochi_d3fi_bot) | ペンディング |
| Discord | 未作成 (予定: もちのDeFi部屋) | ペンディング |
| Instagram | 未作成 (予定: mochi_d3fi) | ペンディング |

---

## API Status

| API | Status | Notes |
|-----|--------|-------|
| Twitter/X Free Tier | Connected (Read/Write) | 投稿クレジット付与待ち(新規アカウント) |
| Claude API (Haiku 4.5) | Connected | $9.48残高 |
| Telegram Bot API | Not configured | BotFatherでトークン取得が必要 |
| Discord Bot | Not configured | Developer Portalでトークン取得が必要 |
| Instagram Graph API | Not configured | Meta Business Suite設定が必要(後回し) |
| DeFiLlama API | Working | 無料、APIキー不要 |

---

## Referral Targets (Japan)

### Tier 1: Japan Native Cards
| Card | Cashback | Referral | Status |
|------|----------|----------|--------|
| Binance Japan Card (JCB) | 1.6% BNB | Japan users blocked | Live |
| Slash Card (Visa) | Pay-to-Earn | Not announced | Coming soon |
| Nudge/HashPort Card (Visa) | 0.3% JPYC | Not disclosed | Live |
| bitFlyer Credit Card (Visa) | BTC (up to 10% promo) | Standard bitFlyer | Live |

### Tier 2: International (Japan Available)
| Card | Cashback | Referral | Status |
|------|----------|----------|--------|
| KAST Card (Visa) | Up to 12% | $25/referral (uncapped) | Japan unconfirmed |
| Tria Card (Visa) | 1.5-6% TRIA | Ambassador (invite-only) | Available |
| Tangem Pay (Visa) | None | Not detailed | Available |

### New Protocol Detection
- DeFiLlamaで新興プロトコルを自動検出
- 直近の検出: **Rysk Premium** (Hyperliquid L1, TVL $1.84M, リファーラルあり)

---

## Implementation Phases & Progress

### Phase 0: Foundation [COMPLETED]
- [x] GitHub repository作成 (https://github.com/Saku05092/claudex)
- [x] プロジェクト構造構築 (TypeScript + ESM)
- [x] Core modules: config, database, types, scheduler
- [x] Platform adapters: Twitter, Discord, Telegram, Instagram
- [x] DeFiLlama scraper (新規プロトコル検出 + リファーラル確認)
- [x] クリプトカードデータ (日本向け7枚)
- [x] .env.example + API設定ガイド

### Phase 1: API Integration & Testing [IN PROGRESS]
- [x] Twitter/X API接続確認 (Read/Write権限設定完了)
- [x] Claude API接続確認 (Haiku 4.5動作確認済)
- [x] DeFiLlamaスキャン実行テスト (2プロトコル検出)
- [x] コンテンツ生成テスト (3カテゴリの日本語投稿生成成功)
- [x] Instagram画像生成テスト (Satori + Resvg, 3枚生成成功)
- [x] Webダッシュボード構築 (クリプトカード比較、ダークテーマ)
- [x] コンテンツ戦略・テンプレート作成 (7カテゴリ、週間スケジュール)
- [ ] 初ツイート投稿 (Twitter APIクレジット付与待ち)
- [ ] Telegram Bot セットアップ
- [ ] Discord Bot セットアップ

### Phase 2: Content Pipeline & Semi-Auto Posting [NOT STARTED]
- [ ] コンテンツ生成パイプライン構築 (テンプレート → Claude API → レビュー → 投稿)
- [ ] 半自動承認フロー (生成→確認→投稿)
- [ ] マルチプラットフォーム同時投稿
- [ ] リファーラルリンク管理システム
- [ ] Instagram カルーセル画像自動生成
- [ ] 投稿履歴・分析DB
- [ ] note.comブログ連携

### Phase 3: Web Dashboard Enhancement [NOT STARTED]
- [ ] ダッシュボードをNext.jsに移行
- [ ] ドメイン取得・デプロイ (Vercel or Cloudflare Pages)
- [ ] カード比較のリアルタイム更新
- [ ] リファーラルトラッキング (UTMパラメータ)
- [ ] ユーザーレビュー機能
- [ ] SEO最適化 (クリプト初心者向けキーワード)
- [ ] Linktree/link-in-bio ページ

### Phase 4: Full Automation & Scaling [NOT STARTED]
- [ ] 投稿の完全自動化 (承認フロー不要)
- [ ] A/Bテスト (投稿文バリエーション自動生成・効果測定)
- [ ] フォロワー成長分析・最適化
- [ ] 新規リファーラルプログラム自動検出・登録
- [ ] クラウド移行 (Railway)
- [ ] 収益ダッシュボード
- [ ] 月収100万円達成に向けたスケーリング戦略

---

## Monthly Cost Estimate

| Item | Phase 1 | Phase 3+ |
|------|---------|----------|
| Twitter/X API (Free) | $0 | $0-100 |
| Claude API (Haiku) | ~$10-20 | ~$50 |
| Domain | $0 | ~$12/year |
| Hosting (Vercel) | $0 | $20 |
| Cloud (Railway) | $0 | ~$10-20 |
| **Total** | **~$10-20/mo** | **~$80-200/mo** |

---

## Key Rules

- All promotional content must be marked as **PR**
- All posts must include **DYOR (Do Your Own Research)** disclaimer
- Never provide financial advice (NFA)
- Follow each platform's automation policies
- Japan tax implications: crypto card usage = taxable event
- Content must feel natural and personal (not bot-like)
- Immutable data patterns (never mutate objects)
- No emojis in code or documentation
