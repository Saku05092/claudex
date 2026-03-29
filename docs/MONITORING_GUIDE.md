# X Monitoring System - Usage Guide

## Overview

X (Twitter) APIを使ったエアドロップ関連ツイートの収集・分析パイプライン。

```
X API (検索)
  | scripts/run-monitor.ts
  v
SQLite collected_tweets
  | src/monitoring/tweet-analyzer.ts
  v
API /api/monitor
  | fetch()
  v
Dashboard #/monitor
```

---

## Quick Start

```bash
# 1. ツイート収集 (キーワード検索)
npx tsx scripts/run-monitor.ts --keyword

# 2. APIサーバー起動
npx tsx src/api/server.ts

# 3. ダッシュボードで確認
#    ブラウザで src/dashboard/index.html を開き、Monitor タブをクリック
#    (APIサーバーが localhost:3001 で動いている必要あり)
```

---

## CLI: run-monitor.ts

### 基本コマンド

```bash
# キーワード検索のみ (日次用)
npx tsx scripts/run-monitor.ts --keyword

# インフルエンサー検索のみ (月2回用)
npx tsx scripts/run-monitor.ts --influencer

# 両方実行
npx tsx scripts/run-monitor.ts --both

# 取得件数を指定 (デフォルト: 10)
npx tsx scripts/run-monitor.ts --keyword --max=20
```

### キーワード検索 (--keyword)

5本のクエリを実行:
1. JP: エアドロップ (DeFi/airdrop/TGE)
2. EN: airdrop (farming/claim/eligible/confirmed)
3. Bilingual: TGE/token launch + airdrop/snapshot
4. Bilingual: crypto card + cashback/rewards
5. Bilingual: referral + DeFi/protocol

### インフルエンサー検索 (--influencer)

data/airdrop-influencers.json の50アカウント (20 JP + 30 EN) を
from: OR 形式で3バッチに分けて検索。512文字のクエリ長制限に対応。

### 出力例

```
[Monitor] Starting keyword search...
  [1/5] JP: Airdrop general: "..."
    Found: 10 | New: 10 | Dup: 0
  ...
[Monitor Credit] Queries: 5 | Tweets: 49 | Est. cost: $0.245

=== MONITORING SUMMARY ===
  keyword      | Queries: 5 | Found: 49 | New: 49 | Est. cost: $0.245
  Total new tweets saved: 49
  Total tweets in DB: 49
```

---

## 自動スケジュール

.env に以下を追加すると、メインプロセス起動時にcronスケジューラが有効になる:

```
TWITTER_MONITOR_ENABLED=true
TWITTER_MONITOR_MAX_RESULTS=10
```

| スケジュール | 内容 | cron |
|------------|------|------|
| 毎日 06:00 JST | キーワード検索 | `0 6 * * *` |
| 毎月 1日/15日 06:00 JST | インフルエンサー検索 | `0 6 1,15 * *` |

---

## API Endpoints

APIサーバー起動: `npx tsx src/api/server.ts` (デフォルト port 3001)

| Endpoint | Description |
|----------|-------------|
| GET /api/monitor | 全データ (stats + trending + influencers + tweets) |
| GET /api/monitor/stats | 統計情報 (総件数, 24h件数, コスト等) |
| GET /api/monitor/trending | トレンドプロジェクト (言及数順) |
| GET /api/monitor/influencers | 収集データ内のトップインフルエンサー |
| GET /api/monitor/tweets | 最新収集ツイート (30件) |

### レスポンス例: /api/monitor/stats

```json
{
  "totalTweets": 49,
  "tweetsLast24h": 49,
  "tweetsLast7d": 49,
  "uniqueAuthors": 43,
  "totalRuns": 2,
  "lastRunAt": "2026-03-29T16:02:41.642Z",
  "estimatedTotalCost": 0.49
}
```

---

## Dashboard: Monitor ページ

ブラウザで `src/dashboard/index.html` を開き、ナビの「Monitor」をクリック。

表示内容:
- **Quick Stats**: 総ツイート数, 24h件数, ユニーク著者数, 推定コスト
- **Trending Projects**: 言及数の多いプロジェクト (edgeX, OpenSea等を自動検出)
- **Top Influencers**: エンゲージメント順のインフルエンサー一覧
- **Recent Tweets**: 最新収集ツイート (Xへのリンク付き)

API (localhost:3001) が起動していないとデータは表示されない。

---

## インフルエンサーリスト管理

### ファイル

data/airdrop-influencers.json

### 構成

- japanese: 20アカウント (Alpha Score順)
- international: 30アカウント (Alpha Score順)

### 更新方法

```bash
# リスト再構築 (API消費あり、推定$2-3)
npx tsx scripts/find-airdrop-influencers.ts
npx tsx scripts/find-en-influencers.ts
npx tsx scripts/find-more-influencers.ts
npx tsx scripts/find-final-influencers.ts

# スコアリング再計算のみ (API消費なし)
npx tsx scripts/rescore-influencers.ts
```

### Alpha Score 算出基準 (v2)

- 最低フォロワー 1,000 (スパム除外)
- エンゲージメント率 (フォロワー比)
- 出現頻度 (複数クエリへの登場)
- フォロワースイートスポット (5K-500K を高評価)
- 絶対エンゲージメント量

---

## DB Tables

### collected_tweets

| Column | Type | Description |
|--------|------|-------------|
| tweet_id | TEXT PK | ツイートID (重複排除キー) |
| author_id | TEXT | 著者ID |
| author_username | TEXT | @ユーザー名 |
| author_name | TEXT | 表示名 |
| author_followers | INTEGER | フォロワー数 |
| text | TEXT | ツイート本文 |
| language | TEXT | 言語コード |
| retweet_count | INTEGER | RT数 |
| reply_count | INTEGER | リプライ数 |
| like_count | INTEGER | いいね数 |
| quote_count | INTEGER | 引用数 |
| tweeted_at | TEXT | ツイート日時 |
| source_type | TEXT | keyword / influencer |
| source_query | TEXT | 検索クエリ名 |
| collected_at | TEXT | 収集日時 |

### monitor_runs

| Column | Type | Description |
|--------|------|-------------|
| id | TEXT PK | 実行ID |
| run_type | TEXT | keyword / influencer |
| started_at | TEXT | 開始日時 |
| completed_at | TEXT | 完了日時 |
| queries_executed | INTEGER | 実行クエリ数 |
| tweets_found | INTEGER | 取得ツイート数 |
| tweets_new | INTEGER | 新規保存数 |
| estimated_credits_used | REAL | 推定コスト |
| status | TEXT | running / completed / failed |
| error | TEXT | エラーメッセージ |

---

## コスト管理

詳細は docs/X_API_COST.md を参照。

### 目安

- 1ツイートあたり ~$0.002-0.005
- キーワード検索 (max=10, 5クエリ): ~$0.05-0.25/回
- インフルエンサー検索 (3バッチ, 300件): ~$1.50/回
- ハイブリッド月額推定: $13-31

### コスト削減Tips

- --max=10 (デフォルト) を維持する
- 重複排除により同日2回実行しても新規取得分のみコスト発生
- インフルエンサー検索は月2回に制限
