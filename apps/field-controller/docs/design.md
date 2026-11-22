# Field Controller プラグイン 設計書

> **バージョン**: 1.0
> **最終更新**: 2026-11-23
> **タスク管理**: [tasks.md](./tasks.md)

---

## 目次

- [1. 概要](#1-概要)
  - [1.1 目的](#11-目的)
  - [1.2 提供機能](#12-提供機能)
  - [1.3 技術スタック](#13-技術スタック)
- [2. データモデル](#2-データモデル)
  - [2.1 設定スキーマ（階層図）](#21-設定スキーマ階層図)
  - [2.2 演算子定義（`OPERATOR_TYPES`）](#22-演算子定義operator_types)
  - [2.3 演算子・フィールドタイプ互換性マップ](#23-演算子フィールドタイプ互換性マップ)
  - [2.4 トリガーイベント定義](#24-トリガーイベント定義)
  - [2.5 条件値（`value`）の型設計](#25-条件値valueの型設計)
  - [2.6 バリデーション戦略](#26-バリデーション戦略)
- [3. アーキテクチャ](#3-アーキテクチャ)
  - [3.1 ディレクトリ構成](#31-ディレクトリ構成)
  - [3.2 処理の流れの分担](#32-処理の流れの分担)
- [4. モジュール設計](#4-モジュール設計)
  - [4.1 設定画面の部品](#41-設定画面の部品)
- [5. フロー設計](#5-フロー設計)
  - [5.1 設定保存フロー](#51-設定保存フロー)
  - [5.2 実行フロー（Desktop / Mobile）](#52-実行フローdesktop--mobile)
- [6. 設計判断記録（ADR）](#6-設計判断記録adr)
  - [ADR-001: ルール単位の `enabled` 制御](#adr-001-ルール単位の-enabled-制御)
  - [ADR-002: 条件値（`value`）の型設計](#adr-002-条件値valueの型設計)
  - [ADR-003: マイグレーション戦略](#adr-003-マイグレーション戦略)
- [付録](#付録)
  - [付録A: フィールドタイプ別 UI マッピング](#付録a-フィールドタイプ別-ui-マッピング)

---

## 1. 概要

### 1.1 目的

kintone アプリのフィールドに対して、**条件ベースの動的制御**を実現するプラグイン。
管理者がプラグイン設定画面から GUI でルールを定義し、レコード操作時にフィールドの **非表示** および **編集不可** を自動制御する。

### 1.2 提供機能

| 機能 | 概要 | 対象イベント |
|------|------|-------------|
| **非表示制御（Visibility）** | 条件一致時にフィールドを非表示にする | 詳細・新規・編集（PC / モバイル） |
| **非活性制御（Disable）** | 条件一致時にフィールドを編集不可にする | 一覧編集・新規・編集（PC / モバイル） |

### 1.3 技術スタック

| レイヤー | 技術 |
|----------|------|
| UI フレームワーク | React 19 + MUI 9 |
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
├── visibilityRules: VisibilityRuleSchemaV1[]
│   ├── id: string
│   ├── enabled: boolean
│   ├── block: VisibilityRuleBlockSchemaV1
│   │   ├── conditions: ConditionSchemaV1[]
│   │   │   ├── field: string              // フィールドコード
│   │   │   ├── operator: OPERATOR_TYPES   // 演算子（enum）
│   │   │   └── value: string | string[]   // 比較値
│   │   ├── logic: 'AND' | 'OR'
│   │   └── triggers: VisibilityTriggerSchemaV1[]
│   └── targetFields: string[]
│
└── disableRules: DisableRuleSchemaV1[]
    ├── id: string
    ├── enabled: boolean
    ├── block: DisableRuleBlockSchemaV1
    │   ├── conditions: ConditionSchemaV1[]
    │   ├── logic: 'AND' | 'OR'
    │   └── triggers: DisableTriggerSchemaV1[]
    └── targetFields: string[]
```

### 2.2 演算子定義（`OPERATOR_TYPES`）

| 列挙値 | 用途 | 対応フィールドタイプ |
|--------|------|---------------------|
| `equals` | 完全一致 | 文字列, 数値, 日付 |
| `notEquals` | 不一致 | 文字列, 数値, 日付 |
| `greaterThan` | より大きい | 数値, 日付 |
| `lessThan` | より小さい | 数値, 日付 |
| `greaterThanOrEqual` | 以上 | 数値, 日付 |
| `lessThanOrEqual` | 以下 | 数値, 日付 |
| `includes` | 含む | 文字列, 複数選択 |
| `notIncludes` | 含まない | 文字列, 複数選択 |

### 2.3 演算子・フィールドタイプ互換性マップ

`dynamicSchema.ts` の `isOperatorCompatibleWithFieldType()` で使用する、演算子とフィールドタイプの互換性定義。

```typescript
const OPERATOR_COMPATIBILITY: Record<FieldType, OPERATOR_TYPES[]> = {
  SINGLE_LINE_TEXT: ['equals', 'notEquals', 'includes', 'notIncludes'],
  NUMBER:           ['equals', 'notEquals', 'greaterThan', 'lessThan', 'greaterThanOrEqual', 'lessThanOrEqual'],
  CALC:             ['equals', 'notEquals', 'greaterThan', 'lessThan', 'greaterThanOrEqual', 'lessThanOrEqual'],
  MULTI_LINE_TEXT:  ['includes', 'notIncludes'],
  CHECK_BOX:        ['includes', 'notIncludes'],
  RADIO_BUTTON:     ['includes', 'notIncludes'],
  DROP_DOWN:        ['includes', 'notIncludes'],
  MULTI_SELECT:     ['includes', 'notIncludes'],
  DATE:             ['equals', 'notEquals', 'greaterThan', 'lessThan', 'greaterThanOrEqual', 'lessThanOrEqual'],
  TIME:             ['equals', 'notEquals', 'greaterThan', 'lessThan', 'greaterThanOrEqual', 'lessThanOrEqual'],
  DATETIME:         ['equals', 'notEquals', 'greaterThan', 'lessThan', 'greaterThanOrEqual', 'lessThanOrEqual'],
  OTHERS:           ['includes', 'notIncludes'],
};
```

### 2.4 トリガーイベント定義

#### 非表示制御（Visibility）

| トリガー | PC | モバイル |
|----------|:--:|:--------:|
| 詳細表示 | `app.record.detail.show` | `mobile.app.record.detail.show` |
| 新規作成 | `app.record.create.show` | `mobile.app.record.create.show` |
| 編集 | `app.record.edit.show` | `mobile.app.record.edit.show` |

#### 非活性制御（Disable）

| トリガー | PC | モバイル |
|----------|:--:|:--------:|
| 一覧編集 | `app.record.index.edit.show` | — |
| 新規作成 | `app.record.create.show` | `mobile.app.record.create.show` |
| 編集 | `app.record.edit.show` | `mobile.app.record.edit.show` |

### 2.5 条件値（`value`）の型設計

**定義**: `z.union([z.string(), z.array(z.string())])`

| 型 | 用途 | 例 |
|----|------|-----|
| `string` | 単一値の比較（文字列、数値、日付） | `"100"`, `"2026-01-01"` |
| `string[]` | 複数値の比較（チェックボックス、複数選択） | `["A", "B"]` |

フィールドタイプに応じた詳細な型検証は、動的バリデーション（`dynamicSchema.ts`）で補完する。

> 設計判断の経緯は [ADR-002](#adr-002-条件値valueの型設計) を参照。

### 2.6 バリデーション戦略

```
┌─────────────────┐     ┌──────────────────┐
│  staticSchema   │     │  dynamicSchema   │
│  （構造検証）     │     │  （意味検証）      │
│                 │     │                  │
│  ・型の正当性     │ ──→ │  ・フィールド存在   │
│  ・必須項目      │      │  ・演算子互換性    │
│  ・列挙値範囲     │     │  ・対象フィールド   │
└─────────────────┘     │    存在確認       │
                        └──────────────────┘
                              ↑
                       kintone API から
                       フィールド情報を取得
```

- **静的バリデーション**（`staticSchema.ts`）: Zod スキーマによる構造的な型チェック
- **動的バリデーション**（`dynamicSchema.ts`）: `superRefine` によるアプリ固有のフィールド情報を用いた意味的検証

---

## 3. アーキテクチャ

構成はリポジトリ共通の [docs/architecture.md](../../../docs/architecture.md) に従う。設定画面の骨組み（Provider・保存・リセット・インポート・エクスポート）は共有パッケージの `plugin-shell` が持ち、このプラグインはタブとフォームの部品だけを持つ。

### 3.1 ディレクトリ構成

```
src/
├── config/
│   ├── index.tsx                 # plugin-shell に設定の定義とタブを渡して起動する
│   ├── tabs.tsx                  # 編集不可設定・非表示設定のタブ
│   └── components/
│       ├── DisableSettings.tsx   # 編集不可設定タブ
│       ├── InvisibleSettings.tsx # 非表示設定タブ
│       └── rule/                 # ルールの一覧・カード・条件の一覧・条件行
├── desktop/index.ts              # PC 版のイベントの登録だけ
├── mobile/index.ts               # モバイル版のイベントの登録だけ
└── shared/
    ├── config/                   # スキーマ・動的な検証・既定値と旧版からの移行
    ├── handlers/record.ts        # 条件に合うルールを適用する（kintone の API を触る）
    └── lib/                      # 条件の評価と値の変換（kintone に依存しない）
```

### 3.2 処理の流れの分担

| 場所 | 役割 |
| --- | --- |
| `shared/config/persistence.ts` | `definePluginConfig` で設定の定義を作る。新しいルール・条件の既定値（`createDefaultRule`・`createDefaultCondition`）も持つ |
| `shared/config/dynamicSchema.ts` | アプリのフィールドに依存する検証。フィールドの種類で使える演算子（`getCompatibleOperators`）も持つ |
| `shared/lib/ruleEvaluator.ts` | トリガーと条件（AND/OR）を評価する（`evaluateBlock`） |
| `shared/handlers/record.ts` | 評価に合ったルールの対象フィールドを、編集不可（`disabled`）・非表示（`setFieldShown`）にする（`applyFieldControls`） |

---

## 4. モジュール設計

### 4.1 設定画面の部品

入力欄はすべて共有パッケージの部品を使う（プラグインの中で `Controller` と MUI を直接組み合わせない）。

| 項目 | 部品 | データパス |
| --- | --- | --- |
| ルール名 | `FormTextField` | `*Rules[i].label` |
| 有効/無効 | `FormSwitch` | `*Rules[i].enabled` |
| トリガー | `FormAutocomplete`（複数） | `*Rules[i].block.triggers` |
| 対象フィールド | `FieldSelect`（複数） | `*Rules[i].targetFields` |
| 条件のフィールド | `FieldSelect` | `*Rules[i].block.conditions[j].field` |
| 演算子 | `FormSelect` | `*Rules[i].block.conditions[j].operator` |
| 値 | 下記 | `*Rules[i].block.conditions[j].value` |

値の入力欄は、フィールドの種類と演算子で切り替える（[付録A](#付録a-フィールドタイプ別-ui-マッピング)）。

| 条件 | 部品 |
| --- | --- |
| 選択肢を持つフィールドで、含む・含まない | `FormAutocomplete`（複数） |
| 選択肢を持つフィールドで、それ以外 | `FormSelect` |
| 選択肢を持たないフィールド | `FormTextField`（数値・日付・時刻・日時は入力の種類を合わせる） |

**動的な振る舞い**:
- 条件のフィールドを変えたら、そのフィールドで使える最初の演算子にし、値を空にする
- 演算子を変えたら、値を空にする
- ルールの並べ替えは、カード単位のため独自の作り（dnd-kit）を使う。共有の `DynamicSortableList` は行の並べ替え向けで、見た目と操作が合わない

---

## 5. フロー設計

### 5.1 設定保存フロー

```
ユーザー操作（設定画面）
  ↓
React Hook Form: フォーム値を収集
  ↓
Zod 静的バリデーション (staticSchema)
  ↓
Zod 動的バリデーション (dynamicSchema + kintone フィールド情報)
  ↓
kintone.plugin.setConfig() で JSON 保存（plugin-shell が行う）
```

### 5.2 実行フロー（Desktop / Mobile）

```
kintone イベント発火
  ↓
restoreConfig(): kintone から設定 JSON を復元 + Zod 検証
  ↓
applyFieldControls(event, config)
  ├── 編集不可のルールごとに
  │   ├── rule.enabled === false → スキップ
  │   └── evaluateBlock() に合う → record[field].disabled = true
  └── 非表示のルールごとに
      ├── rule.enabled === false → スキップ
      └── evaluateBlock() に合う → setFieldShown(field, false)（PC とモバイルで API を分ける）
  ↓
return event
```

---

## 6. 設計判断記録（ADR）

### ADR-001: ルール単位の `enabled` 制御

**決定内容**:
Setting ラッパー（`visibilitySetting` / `disableSetting`）を廃止し、ルール単位に `enabled: z.boolean()` を持つフラット構造を採用する。

**背景・理由**:
- 個別ルールの一時無効化が可能（デバッグ・段階的な設定展開に有用）
- Setting ラッパーが不要になり、スキーマとアクセスパスがシンプル化
- 適用する処理（`applyFieldControls`）の `rule.enabled` チェックとの整合性が確保

**検討した代替案**:

```
// 代替案: Setting ラッパー構造
pluginConfig.visibilitySetting.enabled  // 設定全体の有効/無効
pluginConfig.visibilitySetting.rules[i] // 個別ルール

// 採用案: フラット + ルール単位 enabled
pluginConfig.visibilityRules[i].enabled // ルール単位の有効/無効
```

Setting ラッパー方式は「機能全体の ON/OFF」には適するが、個別ルールの無効化ができず柔軟性に欠ける。

### ADR-002: 条件値（`value`）の型設計

**決定内容**:
条件値を `z.union([z.string(), z.array(z.string())])` として定義する。

**背景・理由**:
- `string`: 単一値の比較（文字列、数値、日付）に使用
- `string[]`: 複数値の比較（チェックボックス、複数選択）に使用
- フィールドタイプに応じた詳細な型検証は動的バリデーション（`dynamicSchema.ts`）で補完する

**検討した代替案**:
判別共用体（`{ type: 'single', value: string } | { type: 'multi', values: string[] }`）も検討したが、スキーマの階層が深くなり保存・復元の複雑性が増すため不採用。

### ADR-003: マイグレーション戦略

**決定内容**:
`persistence.ts` にバージョンマイグレーション機構を組み込む。

**背景・理由**:
将来のスキーマ変更に対して、`LATEST_PLUGIN_VERSION` のインクリメントと `migrateConfig()` へのステップ追加で段階的に対応可能とする。

**検討した代替案**:
マイグレーション不要（破壊的変更時にリセット）方式は、ユーザーの設定が失われるリスクがあるため不採用。

---

## 付録

### 付録A: フィールドタイプ別 UI マッピング

`ConditionRow.tsx` の値入力 UI をフィールドタイプに応じて切り替えるための対応表。

| フィールドタイプ | 値入力 UI |
|----------------|----------------|
| `SINGLE_LINE_TEXT` | テキスト入力 |
| `NUMBER` | 数値入力 |
| `CALC` | 数値入力 |
| `MULTI_LINE_TEXT` | テキスト入力 |
| `CHECK_BOX` | マルチセレクト |
| `RADIO_BUTTON` | マルチセレクト |
| `DROP_DOWN` | マルチセレクト |
| `MULTI_SELECT` | マルチセレクト |
| `DATE` | 日付ピッカー |
| `TIME` | 時刻ピッカー |
| `DATETIME` | 日付ピッカー & 時刻ピッカー |
| `OTHERS` | テキスト入力 |
