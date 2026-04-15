# Field Controller プラグイン 設計書

> **バージョン**: 1.0
> **最終更新**: 2026-04-14
> **タスク管理**: [TASKS.md](./TASKS.md)

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
  - [3.2 レイヤー構成図](#32-レイヤー構成図)
  - [3.3 型定義の依存関係](#33-型定義の依存関係)
- [4. モジュール設計](#4-モジュール設計)
  - [4.1 shared/config — 設定基盤](#41-sharedconfig--設定基盤)
  - [4.2 shared/lib — 実行エンジン](#42-sharedlib--実行エンジン)
  - [4.3 desktop / mobile — エントリポイント](#43-desktop--mobile--エントリポイント)
  - [4.4 config/ — 設定画面](#44-config--設定画面)
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
│   │       ├── FormTabs.tsx         # タブ定義
│   │       ├── InvisibleSettings.tsx # 非表示設定タブ
│   │       ├── DisableSettings.tsx   # 非活性設定タブ
│   │       └── rule/                # ルール関連コンポーネント
│   │           ├── RuleCard.tsx      #   ルールカード（1ルール単位）
│   │           ├── RuleList.tsx      #   ルール一覧（並び替え対応）
│   │           ├── ConditionRow.tsx  #   条件行（1条件単位）
│   │           ├── ConditionList.tsx #   条件一覧
│   │           ├── TriggerSelect.tsx #   トリガー選択
│   │           └── FieldSelect.tsx   #   対象フィールド選択
│   ├── hooks/
│   │   ├── usePluginForm.ts         # フォーム初期化
│   │   ├── useSubmitConfig.ts       # 保存処理
│   │   ├── useResetConfig.ts        # リセット処理
│   │   ├── useImportConfig.ts       # インポート処理
│   │   ├── useExportConfig.ts       # エクスポート処理
│   │   ├── useSyncConfig.ts         # 状態同期
│   │   ├── useRuleActions.ts        # ルール CRUD 操作
│   │   └── useConditionActions.ts   # 条件 CRUD 操作
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
        ├── convertNumber.ts         # テキストから数値変換
        ├── convertDate.ts           # テキストから日付変換
        ├── ruleEvaluator.ts         # ルール評価エンジン
        ├── disableExecutor.ts       # 非活性制御の実行
        └── visibilityExecutor.ts    # 非表示制御の実行
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
│  │ 設定復元  │→ │ ルール   │→ │ Executor             │   │
│  │ restore  │  │ 評価     │  │ (Disable/Visibility) │   │
│  │ Config() │  │ evaluate │  │ フィールド操作          │   │
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
│
├── VisibilityRule ────────→ visibilityExecutor.ts
├── DisableRule ───────────→ disableExecutor.ts
├── RuleBlock ─────────────→ ruleEvaluator.ts
│
├── PluginConfigSchema ────→ dynamicSchema.ts (superRefine)
│                          → config/hooks/useImportConfig.ts
│                          → persistence.ts (restoreConfig)
│
└── OPERATOR_TYPES ────────→ dynamicSchema.ts
                           → ruleEvaluator.ts
                           → config/components/ (UI)
```

---

## 4. モジュール設計

### 4.1 shared/config — 設定基盤

#### `staticSchema.ts`

**責務**: プラグイン設定のデータ構造と型を StaticSchema として定義

- `PluginConfigSchemaV1`: 全体設定の Zod スキーマ
- `OPERATOR_TYPES`: 演算子の列挙型
- 型エクスポート: `PluginConfig`, `VisibilityRule`, `DisableRule`, `RuleBlock` 等

#### `dynamicSchema.ts`

**責務**: kintone アプリのフィールド情報を用いた動的バリデーション

- `createConfigSchema(fields)`: フィールド情報から動的 Zod スキーマを生成
- `validateBlocks()`: ルールブロック内の条件を検証
- `isOperatorCompatibleWithFieldType()`: 演算子とフィールドタイプの互換性チェック（[§2.3](#23-演算子フィールドタイプ互換性マップ) 参照）
- `OPERATOR_COMPATIBILITY`: 演算子互換性マップ（`KintoneFormFieldProperty.OneOf['type']` → `OPERATOR_TYPES[]`）

#### `persistence.ts`

**責務**: 設定の保存・復元・マイグレーション

- `createConfig()`: デフォルト設定の生成
- `storeConfig()`: kintone への保存
- `restoreConfig()`: kintone からの復元（Zod 検証付き）
- `migrateConfig()`: 旧バージョンからのマイグレーション

### 4.2 shared/lib — 実行エンジン

#### `ruleEvaluator.ts`

**責務**: 条件の評価ロジック

```
evaluateBlock(block, event)
  ├── トリガーマッチ判定
  ├── 条件なし → 無条件 true
  └── 条件あり
      ├── evaluateCondition() × N
      └── AND/OR でまとめて判定
```

**拡張予定**:
- `greaterThan`, `lessThan` 等の数値比較演算子の実装
- `greaterThanOrEqual`, `lessThanOrEqual` の実装
- `notIncludes` の実装
- 配列値（複数選択フィールド）の `includes` / `notIncludes` 対応

#### `disableExecutor.ts`

**責務**: 条件一致時に `event.record[fieldCode].disabled = true` を設定

- ルール単位の `enabled` チェックにより、個別ルールの有効/無効を制御

#### `visibilityExecutor.ts`

**責務**: 条件一致時に `kintone.app.record.setFieldShown(fieldCode, false)` を呼び出し

- ルール単位の `enabled` チェックにより、個別ルールの有効/無効を制御

### 4.3 desktop / mobile — エントリポイント

#### `desktop/index.ts`

**責務**: PC 向けイベントハンドラの登録

```typescript
const pluginConfig = restoreConfig();
executeDisable(pluginConfig.disableRules, event);
executeVisibility(pluginConfig.visibilityRules, event);
```

- ルール単位の `enabled` による有効/無効判定は Executor 側で実施

#### `mobile/index.ts`

**責務**: モバイル向けイベントハンドラの登録（`desktop/index.ts` と同構造）

### 4.4 config/ — 設定画面

#### コンポーネント階層

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
                            ├── [Tab 0] InvisibleSettings
                            │   └── RuleList (dnd-kit 並び替え)
                            │       └── RuleCard × N
                            │           ├── EnabledSwitch (ルール単位の有効/無効)
                            │           ├── TriggerSelect
                            │           ├── ConditionList
                            │           │   └── ConditionRow × N
                            │           │       ├── FieldSelect (field)
                            │           │       ├── OperatorSelect (operator)
                            │           │       └── ValueInput (value)
                            │           ├── LogicToggle (AND/OR)
                            │           └── TargetFieldSelect (targetFields)
                            │
                            └── [Tab 1] DisableSettings
                                └── RuleList（同上の構造）
```

#### 主要コンポーネント仕様

##### `InvisibleSettings.tsx` / `DisableSettings.tsx`

両コンポーネントはほぼ同一の UI 構造を持つため、共通の `RuleSettingsBase` パターンを検討する。

```typescript
// 設計イメージ
type RuleSettingsProps = {
  rulesPath: 'visibilityRules' | 'disableRules';
  triggerOptions: Array<{ label: string; value: string }>;
};
```

**実装ポイント**:
- `useFormContext<PluginConfig>()` でフォーム状態にアクセス
- `useFieldArray()` でルールの追加・削除・並び替えを管理
- ルール単位の `enabled` スイッチで個別ルールの有効/無効を切り替え
- `enabled: false` のルールはカード全体を視覚的に無効化（グレーアウト・opacity 低下等）

##### `RuleCard.tsx`

1ルール単位の設定カード。

| セクション | UI要素 | データパス |
|-----------|--------|-----------|
| 有効/無効 | スイッチ | `visibilityRules[i].enabled` |
| トリガー | マルチセレクト | `visibilityRules[i].block.triggers` |
| 条件 | 動的フォームリスト | `visibilityRules[i].block.conditions` |
| ロジック | AND/OR トグル | `visibilityRules[i].block.logic` |
| 対象フィールド | フィールドピッカー | `visibilityRules[i].targetFields` |

##### `ConditionRow.tsx`

1条件行の設定フォーム。

```
┌────────────┐ ┌──────────┐ ┌──────────────┐ ┌───┐
│ フィールド   │ │ 演算子    │ │ 値           │ │ × │
│ (Autocomplete)│ │(Select) │ │(Text/Select) │ │   │
└────────────┘ └──────────┘ └──────────────┘ └───┘
```

**動的な振る舞い**:
- フィールド選択時に、そのフィールドタイプに応じた演算子リストをフィルタリング（[§2.3](#23-演算子フィールドタイプ互換性マップ) 参照）
- フィールドタイプに応じて値入力の UI を切り替え（[付録A](#付録a-フィールドタイプ別-ui-マッピング) 参照）

#### カスタムフック仕様

##### `useRuleActions.ts`

ルールの CRUD 操作を管理するカスタムフック。

```typescript
type UseRuleActionsReturn = {
  appendRule: () => void;           // ルール追加
  removeRule: (index: number) => void; // ルール削除
  moveRule: (from: number, to: number) => void; // ルール並び替え
  duplicateRule: (index: number) => void; // ルール複製
};
```

##### `useConditionActions.ts`

条件の CRUD 操作を管理するカスタムフック。

```typescript
type UseConditionActionsReturn = {
  appendCondition: (ruleIndex: number) => void;
  removeCondition: (ruleIndex: number, condIndex: number) => void;
};
```

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
kintone.plugin.setConfig() で JSON 保存
  ↓
Jotai atom に同期 (useSyncConfig)
```

### 5.2 実行フロー（Desktop / Mobile）

```
kintone イベント発火
  ↓
restoreConfig(): kintone から設定 JSON を復元 + Zod 検証
  ↓
executeDisable(disableRules, event)
  └── ルールごとにループ
      ├── rule.enabled === false → スキップ
      └── rule.enabled === true
          └── evaluateBlock()
              ├── トリガーマッチ？
              ├── 条件評価（AND/OR）
              └── マッチ → record[field].disabled = true
  ↓
executeVisibility(visibilityRules, event)
  └── ルールごとにループ
      ├── rule.enabled === false → スキップ
      └── rule.enabled === true
          └── evaluateBlock()
              └── マッチ → setFieldShown(field, false)
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
- Executor 側の `rule.enabled` チェックとの整合性が確保

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
