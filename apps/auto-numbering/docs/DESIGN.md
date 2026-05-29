# 自動採番プラグイン 設計書

> **バージョン**: 1.2
> **最終更新**: 2026-05-29
> **タスク管理**: [TASKS.md](./TASKS.md)
> **変更履歴**:
> - v1.2: Phase 1-2 完了に伴う実装状況の更新、Phase 3 の詳細化
> - v1.1: プラグイン用に全面リファクタリング（kintone Proxy → RestAPIClient、型定義の整理）

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
| kintone API | `@kintone/rest-api-client` 6.1.0 |
| モノレポ共通 | `@kintone-plugin/ui`, `@kintone-plugin/kintone-utils` |

---

## 2. データモデル

### 2.1 設定スキーマ（階層図）

```
PluginConfigSchemaV1
├── version: literal(1)
├── numberingSettings: NumberingSetting[]  # 採番設定（複数設定可能、最大5件）
│   ├── id: string                         # 一意識別子（nanoid）
│   ├── label?: string                     # 表示名（オプション、未入力時は「設定 N」と表示）
│   ├── enabled: boolean                   # 有効/無効フラグ
│   ├── resultFieldCode: string            # 採番結果を書き込むフィールドコード
│   ├── formatParts: FormatPart[]          # 採番フォーマットのパーツ配列
│   │   ├── { type: 'text',  value: string }
│   │   ├── { type: 'field', fieldCode: string }
│   │   └── { type: 'date',  source: DATE_SOURCE, format: DATE_FORMATS }
│   ├── connector: CONNECTORS              # パーツ間の区切り文字
│   └── serialConfig: SerialConfig         # 連番設定
│       ├── initialValue: number           # 連番の初期値
│       ├── digit: number                  # ゼロ埋め桁数
│       ├── position: 'prefix' | 'suffix'  # 連番の位置
│       ├── resetTiming: ResetTiming       # リセットタイミング
│       │   ├── 'none'
│       │   ├── 'yearly'
│       │   ├── 'monthly'
│       │   └── 'daily'
│       └── serialFieldCode?: string       # resetTiming が 'none' の場合のみ必要
└── common: { apiToken?: string }          # APIトークン（共通設定）
```

### 2.2 列挙値・定数定義

#### 定数（`shared/constant/numbering.ts`）

| 定数名 | 値 | 用途 |
|--------|-----|------|
| `FETCH_LIMIT_FOR_RESET` | `500` | リセットあり時の検索上限件数 |
| `DEFAULT_RETRY_COUNT` | `10` | 重複時の最大リトライ回数 |

#### 列挙値（`shared/constant/numbering.ts`）

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
| **RESET_TIMING** | | 連番リセットタイミング |
| `NONE` | `'none'` | リセットなし（全期間で連番） |
| `YEARLY` | `'yearly'` | 年次リセット |
| `MONTHLY` | `'monthly'` | 月次リセット |
| `DAILY` | `'daily'` | 日次リセット |
| **SerialConfig.position** | | 連番の配置位置 |
| `prefix` | `'prefix'` | 先頭（例: 00001-XX-26） |
| `suffix` | `'suffix'` | 末尾（例: XX-26-00001） |

**実装例**:
```typescript
export const DATE_SOURCE = {
  NOW: 'now' as const,
  CREATED_AT: 'createdAt' as const,
} as const;

export const RESET_TIMING = {
  NONE: 'none' as const,
  YEARLY: 'yearly' as const,
  MONTHLY: 'monthly' as const,
  DAILY: 'daily' as const,
} as const;
```

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
│       └── plugin.ts                # プラグイン状態 atom
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
    ├── constant/
    │   └── numbering.ts             # 定数・列挙値定義
    ├── types/
    │   ├── kintone.ts               # kintone 型定義
    │   └── numbering.ts             # 採番処理用の型定義
    └── feature/
        └── numbering/               # 採番機能
            ├── index.ts             # バレルエクスポート
            ├── core/
            │   └── numberingEngine.ts  # 採番処理のメインロジック
            ├── services/
            │   ├── formatService.ts    # フォーマット処理
            │   ├── recordService.ts    # レコード操作（RestAPIClient）
            │   └── serialService.ts    # 連番管理
            └── utils/
                ├── date.ts             # 日付処理
                └── string.ts           # 文字列処理
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

```
staticSchema.ts (型の源泉)
│
├── PluginConfig ─────────→ persistence.ts (createConfig, restoreConfig)
│                          → config/states/plugin.ts (pluginConfigAtom)
│                          → config/hooks/usePluginForm.ts
│                          → config/hooks/useSubmitConfig.ts
│                          → config/hooks/useExportConfig.ts
│                          → desktop/index.ts, mobile/index.ts
│
├── PluginConfigSchema ────→ dynamicSchema.ts (superRefine)
│                          → config/hooks/useImportConfig.ts
│                          → persistence.ts (restoreConfig)
│
├── NumberingSetting ──────→ desktop/index.ts, mobile/index.ts
│                          → feature/numbering/core/numberingEngine.ts
│
├── FormatPart ────────────→ types/numbering.ts (ResolvedPart)
│                          → feature/numbering/services/formatService.ts
│
├── SerialConfig ──────────→ types/numbering.ts (SerialContext, UpdateRecordParams)
│                          → feature/numbering/services/serialService.ts
│                          → feature/numbering/services/recordService.ts
│
└── ConnectorsSchema ──────→ types/numbering.ts (SerialContext)
                           → feature/numbering/services/formatService.ts

types/kintone.ts
│
├── KintoneRecord ─────────→ feature/numbering/services/recordService.ts
│                          → feature/numbering/services/serialService.ts
│                          → feature/numbering/services/formatService.ts
│
└── KintoneEvent ──────────→ feature/numbering/core/numberingEngine.ts
                           → desktop/index.ts, mobile/index.ts

types/numbering.ts
│
├── ResolvedPart ──────────→ feature/numbering/services/formatService.ts
├── SerialContext ─────────→ feature/numbering/services/serialService.ts
├── DateContext ───────────→ feature/numbering/utils/date.ts
└── UpdateRecordParams ────→ feature/numbering/services/recordService.ts
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

### 4.2 shared/feature/numbering — 採番機能

#### モジュール構成

```
feature/numbering/
├── core/
│   └── numberingEngine.ts      # 採番処理のオーケストレーション
├── services/
│   ├── formatService.ts        # フォーマット処理
│   ├── recordService.ts        # レコード操作（RestAPIClient）
│   └── serialService.ts        # 連番管理
└── utils/
    ├── date.ts                 # 日付処理
    └── string.ts               # 文字列処理（ゼロパディング）
```

#### `core/numberingEngine.ts`

**責務**: 採番処理全体のオーケストレーション

**主要関数**:
- `executeNumbering(event, numberingSetting, apiToken?)`: 採番処理のメインエントリーポイント

**処理フロー**:
```typescript
1. 採番済みチェック（record[resultFieldCode].value が存在すればスキップ）
2. リビジョン取得（fetchRecordWithRevision）
3. フォーマットパーツの解決（resolveFormatParts）
4. フォーマット文字列の構築（buildFormatString）
5. 次の連番を取得（resolveNextSerial）
6. 重複回避ループ（最大 DEFAULT_RETRY_COUNT 回）
   - ゼロパディング（padZero）
   - 採番値の構築（buildNumberingValue）
   - 重複チェック（checkDuplicate）
   - 重複あり → currentSerial++ して再試行
   - 重複なし → レコード更新（updateRecord）
7. エラーハンドリング
```

#### `services/formatService.ts`

**責務**: フォーマット処理

**主要関数**:

| 関数 | 概要 |
|------|------|
| `resolveFormatParts(formatParts, record)` | 各フォーマットパーツ（text / field / date）をレコード情報から実値に解決する |
| `buildFormatString(resolvedParts, connector)` | 解決済みパーツを connector で結合し、連番を除いたフォーマット文字列を生成する |
| `buildNumberingValue(formatString, serialString, position, connector)` | 連番文字列とフォーマット文字列を position に応じて結合し最終採番値を生成する |

#### `services/recordService.ts`

**責務**: kintone レコード操作（RestAPIClient 使用）

**主要関数**:

| 関数 | 概要 |
|------|------|
| `createClient(apiToken?)` | RestAPIClient インスタンスを作成 |
| `getRecordCreatedAt(record)` | レコードから作成日時を取得 |
| `fetchRecords(appId, query, fields, apiToken?)` | レコードを取得 |
| `fetchRecordWithRevision(appId, recordId, apiToken?)` | レコードをリビジョン付きで取得 |
| `updateRecord(params)` | レコードを更新（リビジョン対応版） |
| `checkDuplicate(appId, fieldCode, value, existingValues, apiToken?)` | 重複チェック（キャッシュ対応版） |

**RestAPIClient の使用**:
```typescript
const client = new KintoneRestAPIClient({
  baseUrl: location.origin,
  auth: apiToken ? { apiToken } : undefined,
});

// レコード取得
const response = await client.record.getRecords({ app, query, fields });

// レコード更新
await client.record.updateRecord({ app, id, record, revision });
```

#### `services/serialService.ts`

**責務**: 連番管理

**主要関数**:

| 関数 | 概要 |
|------|------|
| `resolveNextSerial(ctx)` | リセットポリシーに応じて次の連番を決定する |
| `extractSerialWithResets(ctx, records)` | リセットあり時に既存レコードから最大連番を抽出する |

**連番取得ロジック**:
```typescript
switch (resetTiming) {
  case RESET_TIMING.NONE:
    // serialFieldCode で最大値取得 + 1
    query = `${serialFieldCode} != "" order by ${serialFieldCode} desc limit 1`;

  case RESET_TIMING.YEARLY:
  case RESET_TIMING.MONTHLY:
  case RESET_TIMING.DAILY:
    // formatString で like 検索 → extractSerialWithResets() + 1
    query = `${resultFieldCode} like "${formatString}" order by $id desc limit ${FETCH_LIMIT_FOR_RESET}`;
}
```

#### `utils/date.ts`

**責務**: 日付処理

**主要関数**:

| 関数 | 概要 |
|------|------|
| `createDateContext(dateString?)` | 日付コンテキストを作成 |
| `formatDate(ctx, format)` | 日付フォーマット |

#### `utils/string.ts`

**責務**: 文字列処理

**主要関数**:

| 関数 | 概要 |
|------|------|
| `padZero(value, digit)` | ゼロ埋め |

### 4.3 desktop / mobile — エントリポイント

#### `desktop/index.ts`

**責務**: PC 向けイベントハンドラの登録

**実装内容**:
```typescript
import { restoreConfig } from '@/shared/config';
import { executeNumbering } from '@/shared/feature/numbering';

// 画面表示時: 採番フィールドを編集不可にする
kintone.events.on(['app.record.create.show', 'app.record.edit.show'], (event) => {
  const record = event.record;
  const pluginConfig = restoreConfig();

  pluginConfig.numberingSettings.forEach(({ resultFieldCode }) => {
    const resultField = record[resultFieldCode];
    // 型ガード: disabledプロパティが存在する型のみ処理
    if (resultField && 'disabled' in resultField) {
      resultField.disabled = true;

      // 作成画面の場合は値をクリア
      if (event.type === 'app.record.create.show' && 'value' in resultField) {
        resultField.value = '';
      }
    }
  });

  return event;
});

// 保存成功時: 採番処理を実行
kintone.events.on(
  ['app.record.create.submit.success', 'app.record.edit.submit.success'],
  async (event) => {
    const pluginConfig = restoreConfig();
    for (const numberingSetting of pluginConfig.numberingSettings) {
      await executeNumbering(event, numberingSetting, pluginConfig.common.apiToken);
    }
    return event;
  }
);
```

#### `mobile/index.ts`

**責務**: モバイル向けイベントハンドラの登録

**実装内容**: `desktop/index.ts`と同構造で、イベント名を`mobile.`プレフィックス付きに変更

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

#### `features/NumberingSettings/NumberingSettingsList.tsx`

**概要**: 採番設定の一覧管理コンポーネント（追加・削除・並び替え）

**機能**:
- 複数の採番設定を配列として管理
- 新規設定の追加ボタン
- 各設定の削除ボタン
- 設定の並び替え（ドラッグ&ドロップまたは上下ボタン）

**実装ポイント**:
- `useFieldArray` を使用して配列フィールドを管理
- 最低 1 件の設定を保持（全削除を防ぐ）
- 削除時の確認ダイアログ

---

#### `features/NumberingSettings/NumberingSettingItem.tsx`

**概要**: 個別の採番設定フォーム

| セクション | UI 要素 | データパス |
|-----------|---------|-----------|
| 採番結果フィールド | フィールドセレクター | `numberingSettings[index].resultFieldCode` |
| フォーマットパーツ | パーツエディター | `numberingSettings[index].formatParts` |
| 区切り文字 | セレクトボックス | `numberingSettings[index].connector` |
| 連番設定 | 連番設定エディター | `numberingSettings[index].serialConfig` |
| プレビュー | 採番例の表示 | （計算値） |

**実装ポイント**:
- Accordion または Card で折りたたみ可能に
- 各設定に識別用のラベル（例: 設定 1、設定 2）
- バリデーションエラーの表示

---

#### `features/NumberingSettings/ResultFieldSelector.tsx`

**概要**: 採番結果を書き込むフィールドの選択

**機能**:
- kintone アプリのフィールド一覧から選択
- 対応フィールド型: 文字列（1行）のみ
- 既に他の設定で使用中のフィールドは警告表示

**実装ポイント**:
- `useAppFields()` フックでフィールド情報を取得
- フィールド型でフィルタリング
- 重複使用の警告（エラーではなく警告）

---

#### `features/NumberingSettings/FormatPartsEditor.tsx`

**概要**: フォーマットパーツの配列編集

**機能**:
- パーツの追加（text / field / date）
- パーツの削除
- パーツの並び替え
- 各パーツタイプに応じた設定 UI

**実装ポイント**:
- `useFieldArray` で動的配列管理
- パーツタイプ選択後に対応する設定フォームを表示
- ドラッグ&ドロップまたは上下ボタンで並び替え

---

#### `features/NumberingSettings/FormatPartItem.tsx`

**概要**: 個別フォーマットパーツの設定

**パーツタイプ別の UI**:

| type | 設定項目 | UI 要素 |
|------|---------|---------|
| `text` | `value` | テキスト入力 |
| `field` | `fieldCode` | フィールドセレクター |
| `date` | `source` | ラジオボタン（now / createdAt） |
|  | `format` | セレクトボックス（YYYYMMDD / YYMMDD / ...） |

**実装ポイント**:
- パーツタイプに応じた条件付きレンダリング
- field タイプは文字列・数値・日付フィールドのみ選択可能
- date タイプのフォーマットプレビュー表示

---

#### `features/NumberingSettings/ConnectorSelector.tsx`

**概要**: パーツ間の区切り文字選択

**機能**:
- 定義済み区切り文字から選択（ハイフン、アンダースコア、なし、等）
- カスタム区切り文字の入力（将来拡張）

**実装ポイント**:
- セレクトボックスまたはラジオボタン
- プレビューに反映

---

#### `features/NumberingSettings/SerialConfigEditor.tsx`

**概要**: 連番設定の編集

| 設定項目 | UI 要素 | データパス |
|---------|---------|-----------|
| 初期値 | 数値入力 | `serialConfig.initialValue` |
| ゼロ埋め桁数 | 数値入力 | `serialConfig.digit` |
| 連番位置 | ラジオボタン（prefix / suffix） | `serialConfig.position` |
| リセットタイミング | セレクトボックス | `serialConfig.resetTiming` |
| 連番管理フィールド | フィールドセレクター（resetTiming='none' の場合のみ） | `serialConfig.serialFieldCode` |

**実装ポイント**:
- `resetTiming` が 'none' の場合のみ `serialFieldCode` を表示
- 数値フィールドのみ選択可能（serialFieldCode）
- バリデーション: digit は 1-10 の範囲

---

#### `features/NumberingSettings/PreviewDisplay.tsx`

**概要**: 採番結果のプレビュー表示

**機能**:
- 現在の設定に基づいた採番例を表示
- 例: `00001-営業部-26`、`営業部-26-00001`

**実装ポイント**:
- フォーム値の変更に応じてリアルタイム更新
- エラーがある場合は「プレビュー不可」と表示
- 実際の採番ロジック（formatService）を使用してプレビュー生成

---

#### `features/GeneralSettings.tsx`

**概要**: 共通設定（API トークン）

| セクション | UI 要素 | データパス |
|-----------|---------|-----------|
| API トークン | パスワード入力 | `common.apiToken` |

**実装ポイント**:
- オプション項目（未入力でも可）
- セキュリティ上、入力値はマスク表示
- ヘルプテキストで用途を説明

### 5.3 カスタムフック仕様

#### `useAppFields.ts`

**概要**: kintone アプリのフィールド情報を取得するフック

```typescript
type UseAppFieldsReturn = {
  fields: kintone.FieldInfo[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
};

function useAppFields(): UseAppFieldsReturn;
```

**実装ポイント**:
- `kintone.api()` でフィールド情報を取得
- 取得結果を Jotai atom にキャッシュ
- エラー時のリトライ機能

---

#### `useNumberingPreview.ts`

**概要**: 採番プレビューを生成するフック

```typescript
type UseNumberingPreviewParams = {
  numberingSetting: NumberingSetting;
};

type UseNumberingPreviewReturn = {
  preview: string | null;
  error: string | null;
};

function useNumberingPreview(params: UseNumberingPreviewParams): UseNumberingPreviewReturn;
```

**実装ポイント**:
- `formatService` を使用してプレビュー生成
- サンプルレコードデータを使用
- エラー時は null を返す

---

#### `useFieldValidation.ts`

**概要**: フィールド選択時の動的バリデーション

```typescript
type UseFieldValidationParams = {
  fieldCode: string;
  fieldType: 'string' | 'number' | 'date';
};

type UseFieldValidationReturn = {
  isValid: boolean;
  errorMessage: string | null;
};

function useFieldValidation(params: UseFieldValidationParams): UseFieldValidationReturn;
```

**実装ポイント**:
- フィールドの存在チェック
- フィールド型の整合性チェック
- 他の設定との重複チェック

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

#### 保存成功時フロー（submit.success イベント）

```
kintone イベント発火（submit.success）
  ↓
restoreConfig(): kintone から設定 JSON を復元 + Zod 検証
  ↓
executeNumbering() 開始
  ↓
採番済みチェック: record[resultFieldCode].value が存在すればスキップ
  ↓
fetchRecordWithRevision(): リビジョン取得（RestAPIClient）
  ↓
resolveFormatParts(): text / field / date パーツを実値に解決
  ↓
buildFormatString(): connector で結合しフォーマット文字列を生成
  ↓
resolveNextSerial(): リセットポリシーに応じて次の連番を取得
  │  resetTiming: 'none'   → serialFieldCode の最大値 + 1
  └  resetTiming: yearly/monthly/daily → formatString で like 検索 → 最大連番 + 1
  ↓
【リトライループ（最大 DEFAULT_RETRY_COUNT 回）】
  padZero() → buildNumberingValue() → checkDuplicate()
  重複あり → currentSerial++ して再試行
  重複なし → updateRecord() でレコード更新（RestAPIClient）
  ↓
return event
```

#### 画面表示時フロー（show イベント）

```
kintone イベント発火（create.show / edit.show）
  ↓
restoreConfig(): 設定を復元
  ↓
numberingSettings をループ
  ↓
resultField.disabled = true  # 採番フィールドを編集不可に
  ↓
create.show の場合: resultField.value = ''  # 値をクリア
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
| フィールド値の取得失敗（type: 'field' パーツ） | `resolveFormatParts()` | エラーをスロー → `executeNumbering()` の catch でアラート表示 |
| RestAPIClient エラー | `createClient()` 経由の API 呼び出し | エラーをスロー → `executeNumbering()` の catch でアラート表示 |
| 最大リトライ回数超過 | `executeNumbering()` のリトライループ | エラーをスロー → catch でアラート表示 |
| 不正な連番値（NaN） | `resolveNextSerial()` / `extractSerialWithResets()` | NaN レコードをスキップ、または明示的エラーをスロー |

### 7.2 kintone プラットフォーム制約

<!-- kintone プラットフォーム固有の制約事項を記述する -->

| 制約 | 内容 | 対策 |
|------|------|------|
| 設定データ容量 | `kintone.plugin.setConfig()` は合計 200KB まで | 不要データの排除、スキーマ設計時にサイズを考慮 |
| API リクエスト制限 | kintone REST API のレートリミット | 必要最小限のリクエストに抑制 |
| 採番の競合 | 複数ユーザーが同時保存した場合に同一連番が払い出される可能性がある | 重複チェック + リトライ（`DEFAULT_RETRY_COUNT` 回）で対処。完全な排他制御は kintone プラットフォームの制約上不可 |
| RestAPIClient の使用 | プラグインからの REST API 呼び出しは `@kintone/rest-api-client` を使用 | `createClient()` でインスタンスを作成し、統一的に処理 |
| リセットあり時の検索件数上限 | `like` クエリで取得するレコードは最大 `FETCH_LIMIT_FOR_RESET`（500）件 | 同一期間内の採番数が 500 件を超える場合は最大連番を見逃す可能性がある（設計上の既知制約） |

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
採番後に `checkDuplicate()` で重複確認し、重複があれば連番をインクリメントして再試行する（最大 `DEFAULT_RETRY_COUNT` 回）。

**背景・理由**:
kintone には採番専用のアトミック API がないため、楽観的ロック的なアプローチで競合を吸収する。

**検討した代替案**:
- 採番専用フィールド（数値型）を使った排他制御 → kintone の制約上、真の排他制御は実現困難なため不採用

---

### ADR-004: kintone Proxy から RestAPIClient への移行

**決定内容**:
kintone API 呼び出しに `@kintone/rest-api-client` を使用する。

**背景・理由**:
- 型安全性の向上（TypeScript の型定義が充実）
- エラーハンドリングの統一
- コードの可読性向上
- メンテナンス性の向上

**実装方法**:
```typescript
const client = new KintoneRestAPIClient({
  baseUrl: location.origin,
  auth: apiToken ? { apiToken } : undefined,
});

// レコード取得
const response = await client.record.getRecords({ app, query, fields });

// レコード更新
await client.record.updateRecord({ app, id, record, revision });
```

**検討した代替案**:
- `kintone.proxy` を使用 → 型安全性が低く、エラーハンドリングが煩雑なため不採用

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
