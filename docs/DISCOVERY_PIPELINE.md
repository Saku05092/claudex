# Discovery Pipeline - Automated Airdrop Registration

## Overview

収集ツイートとDeFiLlamaから新規エアドロップ案件を自動検出し、
Claude APIで評価した上でダッシュボードに自動登録するパイプライン。

```
[収集ツイート]                    [DeFiLlama API]
     |                                |
  プロジェクト名抽出            新プロトコル検出 (14日以内)
     |                                |
  既存キャンペーンと照合        リファーラルプログラム確認
     |                                |
     +----------+---------------------+
                |
       Claude Haiku 4.5 で評価
       (Tier/Risk/Tasks/Description 生成)
                |
          worthy = true?
                |
       campaigns テーブルに INSERT
                |
       Dashboard に自動反映
```

---

## Quick Start

```bash
# ツイートベースのディスカバリー
npx tsx scripts/run-discovery.ts --tweet

# DeFiLlamaベースのディスカバリー
npx tsx scripts/run-discovery.ts --defilama

# 両方実行
npx tsx scripts/run-discovery.ts --all

# 評価数を制限 (デフォルト: 5)
npx tsx scripts/run-discovery.ts --all --max=3
```

---

## Dashboard操作

Monitorタブに3つのDiscoveryボタンが追加されている:
- **Discover (Tweets)** - 収集ツイートから未知プロジェクトを検出・評価
- **Discover (DeFiLlama)** - DeFiLlamaから新プロトコルを検出・評価
- **Discover All** - 両方実行

APIサーバー (`npx tsx src/api/server.ts`) が起動している必要がある。

---

## 自動スケジュール

APIサーバー起動時に自動設定:
- **6時間毎**: Tweet + DeFiLlama Discovery (cron: `0 */6 * * *` JST)
- Discovery毎に最大5件の新規候補を評価

---

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| /api/discovery/run/tweet | POST | ツイートベースのディスカバリー |
| /api/discovery/run/defilama | POST | DeFiLlamaベースのディスカバリー |
| /api/discovery/run/all | POST | 両方実行 |
| /api/campaigns | GET | アクティブキャンペーン (DB) |
| /api/campaigns/all | GET | 全キャンペーン (DB) |

---

## キャンペーン管理

### DB移行

キャンペーンデータは `src/api/data.ts` のハードコードから SQLite `campaigns` テーブルに移行済み。
初回起動時に既存10件が自動シード (INSERT OR IGNORE)。

### campaigns テーブル

既存の AirdropCampaign フィールドに加えて:
- **source**: `manual` / `tweet` / `defilama` (発見元)
- **verified**: 手動確認済みフラグ (自動登録は false)

### データフロー

```
src/api/data.ts (seed data, 10件)
        ↓ seedFromArray() 初回起動時
campaigns テーブル (SQLite)
        ↓ upsert() パイプラインが追加
        ↓ getActive() / getAll()
API /api/campaigns
        ↓ fetch()
Dashboard Airdrops タブ
```

---

## プロジェクト検出ロジック

### ツイートからの検出 (extractUnknownProjects)

以下のパターンでプロジェクト名を抽出:
1. **$TICKER**: `$EDGE`, `$SEA` などのティッカーシンボル
2. **@handle**: プロジェクト系のXアカウント
3. **固有名詞**: 大文字始まりの単語 (エアドロ関連キーワード付近)

フィルタ:
- 既存キャンペーン名と一致するものは除外
- 2回以上言及されたもののみ (ノイズ除去)
- 一般英単語は除外 (The, This, New, Best 等)

### DeFiLlamaからの検出

1. 直近14日に新規登録されたプロトコルを取得
2. TVL順でトップ15を選択
3. 各プロトコルのWebサイトをチェックしリファーラルプログラムを検出
4. リファーラルあり or TVL $5M以上のものを評価対象に

---

## Claude API 評価

### プロンプト

プロジェクト名、言及数、サンプルツイート、DeFiLlamaデータを提供し、
以下を JSON で返却させる:
- worthy (true/false)
- tier (S/A/B/C)
- riskLevel (low/medium/high)
- description (日本語)
- tasks (参加方法)
- estimatedValue, fundingRaised, backers

### Tier基準

- S: 大型資金調達 ($100M+), エアドロップ確定
- A: 中型資金調達 ($10M+), エアドロップ可能性高
- B: 中程度のポテンシャル
- C: 初期段階、投機的

### コスト

- Haiku 4.5: 1評価あたり ~$0.001
- 1回のDiscovery (5件評価): ~$0.005
- 6時間毎 x 30日 = 120回 x $0.005 = **~$0.60/月**

---

## ファイル構成

```
src/discovery/
├── campaign-repository.ts   # campaigns テーブル CRUD + シード
├── campaign-evaluator.ts    # Claude API で案件評価
└── discovery-pipeline.ts    # オーケストレーション

scripts/
└── run-discovery.ts         # CLI エントリポイント
```

### 修正ファイル

- `src/core/database.ts` - campaigns テーブル追加
- `src/api/server.ts` - DB接続、Discovery エンドポイント、cronスケジュール
- `src/monitoring/tweet-analyzer.ts` - extractUnknownProjects 関数追加
- `src/dashboard/index.html` - Discoveryボタン追加
