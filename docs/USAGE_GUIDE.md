# Claudex Usage Guide

## Quick Start

```bash
# 1. Start the API server (AirHunt data source)
npm run api

# 2. Start the dashboard
npx tsx scripts/serve-dashboard.ts
```

- API: http://localhost:3001
- Dashboard: http://localhost:3000

---

## Content Pipeline (Semi-Auto Posting)

コンテンツの生成→確認→投稿のワークフロー。

### Generate a Draft

```bash
# Pattern + topic で下書きを生成
npx tsx scripts/content-pipeline.ts generate personal_experience "edgeXを触ってみた"
npx tsx scripts/content-pipeline.ts generate educational_mini "Perp DEXとは"
npx tsx scripts/content-pipeline.ts generate alpha_roundup "今週のまとめ"
npx tsx scripts/content-pipeline.ts generate comparison "edgeX vs Backpack"
npx tsx scripts/content-pipeline.ts generate deadline_urgency "edgeX TGE 3/31"
npx tsx scripts/content-pipeline.ts generate news "BTC市場動向"
```

### Review and Approve

```bash
# 下書き一覧を確認
npx tsx scripts/content-pipeline.ts list

# 承認 or 却下
npx tsx scripts/content-pipeline.ts approve <draft-id>
npx tsx scripts/content-pipeline.ts reject <draft-id>
```

### Post

```bash
# 承認済みを一括投稿
npx tsx scripts/content-pipeline.ts post-all

# 個別投稿
npx tsx scripts/content-pipeline.ts post <draft-id>
```

### Auto Mode (One Command)

生成 → 承認 → 投稿を一発で実行:

```bash
npx tsx scripts/content-pipeline.ts auto personal_experience "edgeXを触ってみた"
npx tsx scripts/content-pipeline.ts auto news "最新のDeFiニュース"
```

### Available Patterns

| Pattern | 用途 | リファーラル |
|---|---|---|
| `personal_experience` | プロトコルを触った感想 | あり (PR表記) |
| `educational_mini` | DeFi概念の教育投稿 | なし (信頼構築) |
| `alpha_roundup` | 週間エアドロまとめ | なし (中立) |
| `comparison` | 類似プロジェクト比較 | 間接的 |
| `deadline_urgency` | 期限アラート | あり |
| `news` | ニュース引用+コメント | なし |

---

## Quick Tweet (Simple Mode)

パイプラインを経由しない直接投稿:

```bash
npx tsx scripts/post-tweet.ts engagement              # エンゲージメント
npx tsx scripts/post-tweet.ts educational "topic"      # 教育
npx tsx scripts/post-tweet.ts airdrop_experience       # 体験共有
npx tsx scripts/post-tweet.ts airdrop_roundup          # 週間まとめ
npx tsx scripts/post-tweet.ts airdrop_deadline "info"  # 期限
npx tsx scripts/post-tweet.ts custom "free text prompt" # カスタム
npx tsx scripts/post-tweet.ts --dry                    # プレビューのみ
```

---

## Project Research Pipeline

新規プロジェクトを調査してダッシュボードに追加:

```bash
# 調査のみ (DeFiLlama + Claude評価)
npx tsx scripts/research-project.ts "Pendle"

# 調査 + ダッシュボードに自動追加
npx tsx scripts/research-project.ts "Pendle" --publish

# 複数プロジェクト一括
npx tsx scripts/research-project.ts "Morpho" "Drift" "Jupiter" --publish
```

### 調査の流れ

1. DeFiLlama API で TVL/カテゴリ/チェーンを確認
2. 公式サイトでリファーラルプログラムの有無を検出
3. Claude Haiku で総合評価 (Tier S/A/B/C, 適格判断)
4. `--publish` 指定時: ダッシュボードHTMLに自動挿入

---

## Referral Link Management

リファーラルURLの一元管理とUTMトラッキング:

```bash
# リファーラルURLを登録
npx tsx scripts/manage-referrals.ts set edgex "https://pro.edgex.exchange/referral/XXXXX"

# 確認
npx tsx scripts/manage-referrals.ts get edgex

# 全リファーラル一覧
npx tsx scripts/manage-referrals.ts list

# UTM付きURL生成
npx tsx scripts/manage-referrals.ts build edgex twitter
# -> https://pro.edgex.exchange/referral/XXXXX?utm_source=claudex&utm_medium=twitter&utm_campaign=edgex&utm_content=post
```

### UTM Parameters

| Param | Value |
|---|---|
| utm_source | claudex |
| utm_medium | twitter / telegram / discord / instagram / web |
| utm_campaign | campaign ID (e.g., edgex) |
| utm_content | tweet / post / story / cta |

---

## Instagram Carousel Generation

エアドロップ案件からInstagram用カルーセル画像を自動生成:

```bash
# 特定キャンペーンのカルーセル
npx tsx scripts/generate-carousel.ts edgex

# 全アクティブキャンペーンのカルーセル
npx tsx scripts/generate-carousel.ts all
```

### 生成されるスライド

1. **タイトルカード**: キャンペーン名 + Tier
2. **詳細スライド**: 説明 + 推定価値
3. **タスクスライド**: ユーザーがやるべきことTop 3
4. **CTAスライド**: "Follow @mochi_d3fi" + リファーラルリンク

出力先: `data/images/carousel/{campaignId}/`

---

## Post History & Analytics

投稿履歴の確認と統計:

```bash
# 直近の投稿一覧
npx tsx scripts/post-history.ts list
npx tsx scripts/post-history.ts list --limit=50

# 統計 (プラットフォーム別、カテゴリ別、日別)
npx tsx scripts/post-history.ts stats

# 今日の投稿
npx tsx scripts/post-history.ts today
```

---

## Twitter Monitoring

Twitter上のエアドロップ関連投稿を監視:

```bash
# キーワード + インフルエンサー監視を実行
npx tsx scripts/run-monitor.ts
```

### API経由での実行

```bash
# キーワード検索
curl -X POST http://localhost:3001/api/monitor/run/keyword

# インフルエンサー検索
curl -X POST http://localhost:3001/api/monitor/run/influencer

# 両方
curl -X POST http://localhost:3001/api/monitor/run/both

# トレンド確認
curl http://localhost:3001/api/monitor/trending

# 統計
curl http://localhost:3001/api/monitor/stats
```

---

## Discovery Pipeline

ツイートやDeFiLlamaから新規案件を自動検出:

```bash
npx tsx scripts/run-discovery.ts
```

### API経由

```bash
curl -X POST http://localhost:3001/api/discovery/run/all
curl -X POST http://localhost:3001/api/discovery/run/tweet
curl -X POST http://localhost:3001/api/discovery/run/defilama
```

---

## DeFiLlama Scan

新興プロトコルをスキャン (直近7日、TVL $100K+):

```bash
npx tsx scripts/scan-defilama.ts
```

---

## Dashboard Management

```bash
# ダッシュボード起動
npx tsx scripts/serve-dashboard.ts

# ページ構成
#   http://localhost:3000/#/airdrops     - エアドロップ一覧
#   http://localhost:3000/#/airdrop/{id} - 案件詳細
#   http://localhost:3000/#/cards        - クリプトカード比較
```

---

## API Server

```bash
npm run api       # 起動 (port 3001)
npm run api:dev   # Watch mode
```

### Endpoints

| Method | Path | Description |
|---|---|---|
| GET | /api/health | サービス状態 |
| GET | /api/campaigns | アクティブ案件一覧 |
| GET | /api/campaigns/all | 全案件 |
| GET | /api/campaigns/:id | 個別案件 |
| GET | /api/monitor | 監視ダッシュボード |
| GET | /api/monitor/stats | 監視統計 |
| GET | /api/monitor/trending | トレンドプロジェクト |
| GET | /api/monitor/influencers | トップインフルエンサー |
| GET | /api/monitor/tweets | 最近のツイート |
| POST | /api/monitor/run/keyword | キーワード検索実行 |
| POST | /api/monitor/run/influencer | インフルエンサー検索実行 |
| POST | /api/monitor/run/both | 両方実行 |
| POST | /api/discovery/run/tweet | ツイートベース検出 |
| POST | /api/discovery/run/defilama | DeFiLlamaベース検出 |
| POST | /api/discovery/run/all | 全検出実行 |

---

## Verification Scripts

```bash
npx tsx scripts/verify-twitter.ts    # Twitter API接続確認
npx tsx scripts/verify-claude.ts     # Claude API接続確認
```

---

## Daily Workflow Example

```bash
# 1. 朝: 最新ニュースでツイート
npx tsx scripts/content-pipeline.ts auto news "今日のDeFiニュース"

# 2. 昼: エアドロ案件を調査
npx tsx scripts/research-project.ts "NewProject" --publish

# 3. 夕方: 体験共有ツイート
npx tsx scripts/content-pipeline.ts auto personal_experience "Lineaを触ってみた"

# 4. 夜: 週間まとめ (金曜)
npx tsx scripts/content-pipeline.ts auto alpha_roundup "今週のまとめ"

# 5. 履歴確認
npx tsx scripts/post-history.ts today
npx tsx scripts/post-history.ts stats
```

---

## Environment Variables (.env)

```
# Twitter/X API (Pay-Per-Use)
TWITTER_API_KEY=
TWITTER_API_SECRET=
TWITTER_ACCESS_TOKEN=
TWITTER_ACCESS_TOKEN_SECRET=
TWITTER_BEARER_TOKEN=

# Claude API
ANTHROPIC_API_KEY=

# Discord (optional)
DISCORD_BOT_TOKEN=
DISCORD_CLIENT_ID=

# Telegram (optional)
TELEGRAM_BOT_TOKEN=

# Instagram (optional)
META_ACCESS_TOKEN=
INSTAGRAM_BUSINESS_ACCOUNT_ID=

# Monitoring
TWITTER_MONITOR_MAX_RESULTS=10
TWITTER_MONITOR_ENABLED=false
```
