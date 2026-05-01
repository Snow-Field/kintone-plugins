# 自動採番プラグイン 設計書

> **バージョン**: 1.0
> **最終更新**: 2026-04-30
> **タスク管理**: [TASKS.md](./TASKS.md)

---

## 目次

- [1. 概要](#1-概要)
  - [1.1 目的](#11-目的)
  - [1.2 提供機能](#12-提供機能)
  - [1.3 技術スタック](#13-技術スタック)
- [2. データモデル](#2-データモデル)
  - [2.1 設定スキーマ（階層図）](#21-設定スキーマ階層図)
  - [2.2 列挙値・定数定義](#22-列挙値定数定義)
  - [2.3 バリデーション戦略](#23-バリデーション戦略)
- [3. アーキテクチャ](#3-アーキテクチャ)
  - [3.1 ディレクトリ構成](#31-ディレクトリ構成)
  - [3.2 レイヤー構成図](#32-レイヤー構成図)
  - [3.3 型定義の依存関係](#33-型定義の依存関係)
- [4. モジュール設計](#4-モジュール設計)
  - [4.1 shared/config — 設定基盤](#41-sharedconfig--設定基盤)
  - [4.2 shared/lib — ビジネスロジック](#42-sharedlib--ビジネスロジック)
  - [4.3 desktop / mobile — エントリポイント](#43-desktop--mobile--エントリポイント)
- [5. 設定画面設計](#5-設定画面設計)
  - [5.1 コンポーネント階層](#51-コンポーネント階層)
  - [5.2 主要コンポーネント仕様](#52-主要コンポーネント仕様)
  - [5.3 カスタムフック仕様](#53-カスタムフック仕様)
- [6. フロー設計](#6-フロー設計)
  - [6.1 kintone イベント定義](#61-kintone-イベント定義)
  - [6.2 設定保存フロー](#62-設定保存フロー)
  - [6.3 実行フロー（Desktop / Mobile）](#63-実行フローdesktop--mobile)
- [7. エラーハンドリングと制約事項](#7-エラーハンドリングと制約事項)
  - [7.1 エラーハンドリング方針](#71-エラーハンドリング方針)
  - [7.2 kintone プラットフォーム制約](#72-kintone-プラットフォーム制約)
- [8. 設計判断記録（ADR）](#8-設計判断記録adr)
- [付録](#付録)

---

## 1. 概要

### 1.1 目的

kintone アプリでユニークキーを自動採番するプラグイン。
管理者がプラグイン設定画面から自動採番ルールを定義して、レコード保存時に設定したルールをもとに自動採番を実行する。

### 1.2 提供機能

<!-- 主要な機能を表形式で一覧化する -->

| 機能 | 概要 | 対象イベント |
|------|------|-------------|
| **採番処理** | 最新の番号で採番する | 追加・編集・一覧編集保存成功時（PC / モバイル） |
| **非活性制御** | 採番フィールドを編集不可にする | 追加・編集・一覧編集画面表示時（PC / モバイル） |

### 1.3 技術スタック

| レイヤー | 技術 |
|----------|------|
| UI フレームワーク | React 19 + MUI 7 |
| 状態管理 | Jotai |
| フォーム管理 | React Hook Form + Zod Resolver |
| バリデーション | Zod 4（静的 + 動的） |
| ビルドツール | Rsbuild |
| モノレポ共通 | `@kintone-plugin/ui`, `@kintone-plugin/kintone-utils` |

---

## 2. データモデル

### 2.1 設定スキーマ（階層図）

```
PluginConfigSchemaV1
├── version: literal(1)
├── resultFieldCode: string          # 採番結果を書き込むフィールドコード
├── apiToken?: string                # kintone API トークン（省略可）
├── formatParts: FormatPart[]        # 採番フォーマットのパーツ配列
│   ├── { type: 'text',  value: string }
│   ├── { type: 'field', fieldCode: string }
│   └── { type: 'date',  source: DATE_SOURCE, format: DATE_FORMATS }
├── connector: CONNECTORS            # パーツ間の区切り文字
├── serialConfig: SerialConfig       # 連番設定
│   ├── initialValue: number         # 連番の初期値
│   ├── digit: number                # ゼロ埋め桁数
│   ├── position: 'prefix' | 'suffix'  # 連番の位置
│   └── resetTiming: ResetTiming     # リセットタイミング
│       ├── 'none',
│       ├── 'yearly',
│       ├── 'monthly',
│       └── 'daily'
└── maxRetryCount: number            # 重複時の最大リトライ回数
```

### 2.2 列挙値・定数定義

| 列挙値 | 値 | 用途 |
|--------|-----|------|
| **DATE_SOURCE** | | 日付ソースの指定 |
| `NOW` | `'now'` | 現在日時を使用 |
| `CREATED_AT` | `'createdAt'` | レコード作成日時を使用 |
| **DATE_FORMATS** | | 日付フォーマット |
| `YYYYMMDD` | `'YYYYMMDD'` | 例: 20260430 |
| `YYMMDD` | `'YYMMDD'` | 例: 260430 |
| `YYYYMM` | `'YYYYMM'` | 例: 202604 |
| `YYMM` | `'YYMM'` | 例: 2604 |
| `YYYY` | `'YYYY'` | 例: 2026 |
| `YY` | `'YY'` | 例: 26 |
| **CONNECTORS** | | パーツ間の区切り文字 |
| `HYPHEN` | `'-'` | ハイフン区切り |
| **ResetTiming** | | 連番リセットタイミング |
| `none` | `'none'` | リセットなし（全期間で連番） |
| `yearly` | `'yearly'` | 年次リセット |
| `monthly` | `'monthly'` | 月次リセット |
| `daily` | `'daily'` | 日次リセット |
| **SerialConfig.position** | | 連番の配置位置 |
| `prefix` | `'prefix'` | 先頭（例: 00001-XX-26） |
| `suffix` | `'suffix'` | 末尾（例: XX-26-00001） |

### 2.3 バリデーション戦略

```
┌─────────────────┐     ┌──────────────────┐
│  staticSchema   │     │  dynamicSchema   │
│  （構造検証）     │     │  （意味検証）      │
│                 │     │                  │
│  ・型の正当性     │ ──→ │  ・フィールド存在   │
│  ・必須項目      │      │  ・値の整合性     │
│  ・列挙値範囲     │     │  ・ビジネスルール  │
└─────────────────┘     └──────────────────┘
                              ↑
                       kintone API から
                       フィールド情報を取得
```

- **静的バリデーション**（`staticSchema.ts`）: Zod スキーマによる構造的な型チェック
- **動的バリデーション**（`dynamicSchema.ts`）: `superRefine` によるアプリ固有のフィールド情報を用いた意味的検証

---

## 3. アーキテクチャ

### 3.1 ディレクトリ構成

```
src/
├── config/                          # 設定画面（React SPA）
│   ├── index.tsx                    # エントリーポイント
│   ├── App.tsx                      # ルートコンポーネント
│   ├── components/
│   │   ├── PluginContent.tsx        # メインフォームコンテナ
│   │   ├── PluginErrorBoundary.tsx  # エラーバウンダリ
│   │   └── features/
│   │       └── {{機能別コンポーネント}}
│   ├── hooks/
│   │   ├── usePluginForm.ts         # フォーム初期化
│   │   ├── useSubmitConfig.ts       # 保存処理
│   │   ├── useResetConfig.ts        # リセット処理
│   │   ├── useImportConfig.ts       # インポート処理
│   │   ├── useExportConfig.ts       # エクスポート処理
│   │   └── useSyncConfig.ts         # 状態同期
│   └── states/
│       ├── store.ts                 # Jotai ストア
│       └── plugin.ts               # プラグイン状態 atom
│
├── desktop/                         # デスクトップ実行エントリ
│   └── index.ts                     # イベントハンドラ登録
│
├── mobile/                          # モバイル実行エントリ
│   └── index.ts                     # イベントハンドラ登録
│
└── shared/                          # 設定画面・実行の両方で共有
    ├── config/
    │   ├── index.ts                 # バレルエクスポート
    │   ├── staticSchema.ts          # Zod 静的スキーマ定義
    │   ├── dynamicSchema.ts         # 動的バリデーション生成
    │   └── persistence.ts           # 設定の保存・復元・マイグレーション
    └── lib/
        └── numbering.ts             # 採番コアロジック（resolveFormatParts, resolveNextSerial 等）
```

### 3.2 レイヤー構成図

```
┌──────────────────────────────────────────────────────────┐
│                    設定画面 (config/)                      │
│  ┌─────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │  React   │  │ React    │  │  Jotai   │  │  Zod     │  │
│  │  UI      │→ │ Hook Form│→ │  State   │→ │ Validate │  │
│  │Components│  │          │  │          │  │          │  │
│  └─────────┘  └──────────┘  └──────────┘  └──────────┘  │
│         ↓           ↓                           ↓        │
│  ┌──────────────────────────────────────────────────┐    │
│  │              shared/config/persistence.ts         │    │
│  │         kintone.plugin.setConfig() で保存           │    │
│  └──────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────┘
                            ↓ JSON
┌──────────────────────────────────────────────────────────┐
│              実行レイヤー (desktop/ | mobile/)              │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────────┐   │
│  │ 設定復元  │→ │ ビジネス  │→ │ kintone API          │   │
│  │ restore  │  │ ロジック  │  │ フィールド操作          │   │
│  │ Config() │  │          │  │                      │   │
│  └──────────┘  └──────────┘  └──────────────────────┘   │
└──────────────────────────────────────────────────────────┘
```

### 3.3 型定義の依存関係

<!-- 型の定義元（源泉）と、それを参照するモジュールの関係を記載する -->

```
staticSchema.ts (型の源泉)
│
├── PluginConfig ─────────→ persistence.ts (createConfig, restoreConfig)
│                          → config/states/plugin.ts (pluginConfigAtom)
│                          → config/hooks/usePluginForm.ts
│                          → config/hooks/useSubmitConfig.ts
│                          → config/hooks/useExportConfig.ts
│
├── PluginConfigSchema ────→ dynamicSchema.ts (superRefine)
│                          → config/hooks/useImportConfig.ts
│                          → persistence.ts (restoreConfig)
│
├── FormatPart ────────────→ shared/lib/numbering.ts (resolveFormatParts)
├── SerialConfig ──────────→ shared/lib/numbering.ts (resolveNextSerial, buildNumberingValue)
├── NumberingSettings ─────→ desktop/index.ts, mobile/index.ts (main 関数の引数)
└── DateContext ───────────→ shared/lib/numbering.ts (createDateContext, formatDate)
```

---

## 4. モジュール設計

### 4.1 shared/config — 設定基盤

#### `staticSchema.ts`

**責務**: プラグイン設定のデータ構造と型を StaticSchema として定義

- `PluginConfigSchemaV1`: 全体設定の Zod スキーマ
- 型エクスポート: `PluginConfig` 等

#### `dynamicSchema.ts`

**責務**: kintone アプリのフィールド情報を用いた動的バリデーション

- `createConfigSchema(fields)`: フィールド情報から動的 Zod スキーマを生成

#### `persistence.ts`

**責務**: 設定の保存・復元・マイグレーション

- `createConfig()`: デフォルト設定の生成
- `storeConfig()`: kintone への保存
- `restoreConfig()`: kintone からの復元（Zod 検証付き）
- `migrateConfig()`: 旧バージョンからのマイグレーション

### 4.2 shared/lib — ビジネスロジック

#### `numbering.ts`

**責務**: 採番処理のコアロジック全体を担う

主要な関数:

| 関数 | 概要 |
|------|------|
| `resolveFormatParts(formatParts, record)` | 各フォーマットパーツ（text / field / date）をレコード情報から実値に解決する |
| `buildFormatString(resolvedParts, connector)` | 解決済みパーツを connector で結合し、連番を除いたフォーマット文字列を生成する |
| `resolveNextSerial(ctx)` | リセットポリシーに応じて次の連番を決定する（kintone API 呼び出しを含む） |
| `extractSerialWithResets(ctx, records)` | リセットあり時に既存レコードから最大連番を抽出する |
| `buildNumberingValue(formatString, serialString, position, connector)` | 連番文字列とフォーマット文字列を position に応じて結合し最終採番値を生成する |
| `checkDuplicate(appId, fieldCode, value, apiToken)` | 採番値の重複チェックを行う |
| `updateRecords(...)` | 採番値をレコードに書き戻す（`resetPolicy.timing === 'none'` の場合は連番フィールドも更新） |
| `main(event, settings)` | 採番処理全体のオーケストレーション（採番済みチェック → 採番 → 重複時リトライ → 更新） |

**採番フロー概要**:

```
resolveFormatParts()  →  buildFormatString()
                                ↓
                        resolveNextSerial()
                          ├── timing: 'none'  → serialFieldCode で最大値取得 + 1
                          └── timing: yearly/monthly/daily
                                → formatString で like 検索 → extractSerialWithResets() + 1
                                ↓
                        padZero() → buildNumberingValue()
                                ↓
                        checkDuplicate() → 重複なら currentSerial++ してリトライ
                                ↓
                        updateRecords()
```

### 4.3 desktop / mobile — エントリポイント

#### `desktop/index.ts`

**責務**: PC 向けイベントハンドラの登録

```typescript
const pluginConfig = restoreConfig();
// イベントごとのロジック呼び出し
```

#### `mobile/index.ts`

**責務**: モバイル向けイベントハンドラの登録（`desktop/index.ts` と同構造）

---

## 5. 設定画面設計

### 5.1 コンポーネント階層

<!-- 設定画面の UI コンポーネントツリーを記載する -->

```
App
└── JotaiProvider + PluginThemeProvider + SnackbarProvider
    └── PluginErrorBoundary
        └── Suspense
            └── PluginContent
                └── FormProvider (React Hook Form)
                    └── PluginContentForm
                        ├── Header (タブ / メニュー / 保存ボタン)
                        └── Form
                            └── {{機能別コンポーネント}}
```

### 5.2 主要コンポーネント仕様

<!-- 主要なコンポーネントの仕様を記述する。以下の形式を参考にすること。 -->
<!--
#### `コンポーネント名.tsx`

**概要**: {{コンポーネントの概要}}

| セクション | UI 要素 | データパス |
|-----------|---------|-----------|
| {{セクション名}} | {{UI 要素}} | {{フォームのデータパス}} |

**実装ポイント**:
- {{ポイント1}}
- {{ポイント2}}
-->

### 5.3 カスタムフック仕様

<!-- プラグイン固有のカスタムフックを記述する。以下の形式を参考にすること。 -->
<!--
#### `useXxx.ts`

**概要**: {{フックの概要}}

```typescript
type UseXxxReturn = {
  xxx: () => void;
};
```
-->

---

## 6. フロー設計

### 6.1 kintone イベント定義

| トリガー | PC | モバイル |
|----------|:--:|:--------:|
| 追加・編集画面 表示時（採番フィールド非活性化） | `app.record.create.show` / `app.record.edit.show` | `mobile.app.record.create.show` / `mobile.app.record.edit.show` |
| 追加保存成功時（採番実行） | `app.record.create.submit.success` | `mobile.app.record.create.submit.success` |
| 編集保存成功時（採番実行） | `app.record.edit.submit.success` | `mobile.app.record.edit.submit.success` |

### 6.2 設定保存フロー

```
ユーザー操作（設定画面）
  ↓
React Hook Form: フォーム値を収集
  ↓
Zod 静的バリデーション (staticSchema)
  ↓
Zod 動的バリデーション (dynamicSchema + kintone フィールド情報)
  ↓
kintone.plugin.setConfig() で JSON 保存
  ↓
Jotai atom に同期 (useSyncConfig)
```

### 6.3 実行フロー（Desktop / Mobile）

```
kintone イベント発火（submit.success）
  ↓
restoreConfig(): kintone から設定 JSON を復元 + Zod 検証
  ↓
採番済みチェック: record[resultFieldCode].value が存在すればスキップ
  ↓
resolveFormatParts(): text / field / date パーツを実値に解決
  ↓
buildFormatString(): connector で結合しフォーマット文字列を生成
  ↓
resolveNextSerial(): リセットポリシーに応じて次の連番を取得
  │  timing: 'none'   → serialFieldCode の最大値 + 1
  └  timing: yearly/monthly/daily → formatString で like 検索 → 最大連番 + 1
  ↓
【リトライループ（最大 maxRetryCount 回）】
  padZero() → buildNumberingValue() → checkDuplicate()
  重複あり → currentSerial++ して再試行
  重複なし → updateRecords() でレコード更新
  ↓
return event
```

**画面表示時フロー（show イベント）**:

```
kintone イベント発火（create.show / edit.show）
  ↓
record[resultFieldCode].disabled = true  # 採番フィールドを編集不可に
  ↓
create.show の場合: record[resultFieldCode].value = ''  # 値をクリア
  ↓
return event
```

---

## 7. エラーハンドリングと制約事項

### 7.1 エラーハンドリング方針

<!-- プラグインのエラーハンドリング方針を記述する -->

| エラーシナリオ | 発生箇所 | フォールバック戦略 |
|--------------|---------|------------------|
| 設定復元時のスキーマ不一致 | `restoreConfig()` | デフォルト設定へフォールバック |
| マイグレーション失敗 | `migrateConfig()` | デフォルト設定へフォールバック + コンソール警告 |
| kintone フィールド情報の取得失敗 | 動的バリデーション | エラー通知を表示し、保存を中断 |
| 動的バリデーションエラー | `createConfigSchema()` | フォームにフィールド単位のエラーを表示 |
| フィールド値の取得失敗（type: 'field' パーツ） | `resolveFormatParts()` | エラーをスロー → `main()` の catch でコンソール出力 |
| kintone API エラー（非 200 レスポンス） | `callKintoneProxy()` | エラーをスロー → `main()` の catch でコンソール出力 |
| 最大リトライ回数超過 | `main()` のリトライループ | エラーをスロー → catch でコンソール出力 |
| 不正な連番値（NaN） | `resolveNextSerial()` / `extractSerialWithResets()` | NaN レコードをスキップ、または明示的エラーをスロー |

### 7.2 kintone プラットフォーム制約

<!-- kintone プラットフォーム固有の制約事項を記述する -->

| 制約 | 内容 | 対策 |
|------|------|------|
| 設定データ容量 | `kintone.plugin.setConfig()` は合計 200KB まで | 不要データの排除、スキーマ設計時にサイズを考慮 |
| API リクエスト制限 | kintone REST API のレートリミット | 必要最小限のリクエストに抑制 |
| 採番の競合 | 複数ユーザーが同時保存した場合に同一連番が払い出される可能性がある | 重複チェック + リトライ（`maxRetryCount` 回）で対処。完全な排他制御は kintone プラットフォームの制約上不可 |
| `kintone.proxy` 経由の API 呼び出し | プラグインからの REST API 呼び出しは `kintone.proxy` を経由する必要がある | `callKintoneProxy()` でラップして統一的に処理 |
| リセットあり時の検索件数上限 | `like` クエリで取得するレコードは最大 500 件 | 同一期間内の採番数が 500 件を超える場合は最大連番を見逃す可能性がある（設計上の既知制約） |

---

## 8. 設計判断記録（ADR）

### ADR-001: 採番タイミングを submit.success イベントに限定する

**決定内容**:
採番処理は `app.record.create.submit.success` / `app.record.edit.submit.success`（モバイル含む）でのみ実行する。

**背景・理由**:
`submit` イベント（保存前）で採番すると、バリデーションエラーや通信エラーで保存が中断された場合に連番が欠番になる。`submit.success` であれば保存確定後に採番するため欠番リスクを最小化できる。

**検討した代替案**:
- `submit` イベントで採番 → 保存失敗時に欠番が発生するため不採用

---

### ADR-002: 重複チェック + リトライによる競合対策

**決定内容**:
採番後に `checkDuplicate()` で重複確認し、重複があれば連番をインクリメントして再試行する（最大 `maxRetryCount` 回）。

**背景・理由**:
kintone には採番専用のアトミック API がないため、楽観的ロック的なアプローチで競合を吸収する。

**検討した代替案**:
- 採番専用フィールド（数値型）を使った排他制御 → kintone の制約上、真の排他制御は実現困難なため不採用

---

### ADR-003: リセットあり時の連番抽出に like 検索を使用する

**決定内容**:
`timing: yearly/monthly/daily` の場合、`resultFieldCode like "formatString"` クエリで対象期間のレコードを取得し、連番部分を文字列分割で抽出する。

**背景・理由**:
採番値は単一フィールドに格納されるため、期間フィルタリングには採番値のプレフィックス/サフィックスパターンを利用するしかない。

**検討した代替案**:
- 連番を別フィールドに保持 → `timing: 'none'` では `serialFieldCode` を使う設計で対応済み。リセットあり時は採番値フィールドのみで完結させる方針を採用

---

## 付録

### 付録A: 採番値の組み立てパターン例

`connector: '-'`、`formatParts: [{ type: 'field', fieldCode: '部門' }, { type: 'date', source: 'createdAt', format: 'YY' }]`、`serialConfig.digit: 5` の場合:

| position | 採番値の例 |
|----------|-----------|
| `suffix` | `営業部-26-00001` |
| `prefix` | `00001-営業部-26` |

---

### 付録B: リセットポリシー別の連番取得クエリ

| timing | クエリ例 | 取得対象 |
|--------|---------|---------|
| `none` | `serialFieldCode != "" order by serialFieldCode desc limit 1` | 全期間の最大連番レコード 1 件 |
| `yearly` / `monthly` / `daily` | `resultFieldCode like "営業部-26" order by $id desc limit 500` | formatString に一致する最新 500 件 |
