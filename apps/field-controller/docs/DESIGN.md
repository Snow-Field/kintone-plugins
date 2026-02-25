# Field Controller プラグイン 設計書

> **バージョン**: 1.0
> **最終更新**: 2026-02-25
> **ステータス**: 設計フェーズ（`staticSchema.ts` 完了済み）

---

## 1. プラグイン概要

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

## 2. データ構造設計（Zod スキーマ基盤）

### 2.1 スキーマ階層図

```
PluginConfigSchemaV1
├── version: literal(1)
├── visibilityRules: VisibilityRuleSchemaV1[]
│   ├── id: string
│   ├── enabled: boolean                  // ルール単位の有効/無効
│   ├── block: VisibilityRuleBlockSchemaV1
│   │   ├── conditions: ConditionSchemaV1[]
│   │   │   ├── field: string              // フィールドコード
│   │   │   ├── operator: OPERATOR_TYPES   // 演算子（enum）
│   │   │   └── value: string | string[]   // 比較値
│   │   ├── logic: 'AND' | 'OR'
│   │   └── triggers: VisibilityTriggerSchemaV1[]
│   └── targetFields: string[]             // 制御対象フィールドコード
│
└── disableRules: DisableRuleSchemaV1[]
    ├── id: string
    ├── enabled: boolean                   // ルール単位の有効/無効
    ├── block: DisableRuleBlockSchemaV1
    │   ├── conditions: ConditionSchemaV1[]
    │   ├── logic: 'AND' | 'OR'
    │   └── triggers: DisableTriggerSchemaV1[]
    └── targetFields: string[]
```

### 2.2 演算子一覧（`OPERATOR_TYPES`）

| 列挙値 | 用途 | 対応フィールドタイプ |
|--------|------|---------------------------|
| `equals` | 完全一致 | 配列型を除く全フィールド |
| `notEquals` | 不一致 | 配列型を除く全フィールド |
| `greaterThan` | より大きい | 数値, 日付 |
| `lessThan` | より小さい | 数値, 日付 |
| `greaterThanOrEqual` | 以上 | 数値, 日付 |
| `lessThanOrEqual` | 以下 | 数値, 日付 |
| `includes` | 含む | 文字列, 複数選択 |
| `notIncludes` | 含まない | 文字列, 複数選択 |

### 2.3 トリガーイベント対応表

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

### 2.4 バリデーション戦略

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

## 3. アーキテクチャ設計

### 3.1 ディレクトリ構成（目標）

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
│   │       ├── InvisibleSettings.tsx # 【未実装】非表示設定タブ
│   │       ├── DisableSettings.tsx   # 【未実装】非活性設定タブ
│   │       └── rule/                # 【未実装】ルール関連コンポーネント
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
│   │   ├── useRuleActions.ts        # 【未実装】ルール CRUD 操作
│   │   └── useConditionActions.ts   # 【未実装】条件 CRUD 操作
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
    │   ├── staticSchema.ts          # ✅ Zod 静的スキーマ定義
    │   ├── dynamicSchema.ts         # 動的バリデーション生成
    │   └── persistence.ts           # 設定の保存・復元・マイグレーション
    └── lib/
        ├── ruleEvaluator.ts         # ルール評価エンジン
        ├── disableExecutor.ts       # 非活性制御の実行
        └── visibilityExecutor.ts    # 非表示制御の実行
```

### 3.2 レイヤー構成

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

---

## 4. モジュール詳細設計

### 4.1 shared/config — 設定基盤

#### `staticSchema.ts` ✅（実装済み）

**責務**: プラグイン設定のデータ構造と型を StaticSchema として定義

- `PluginConfigSchemaV1`: 全体設定の Zod スキーマ
- `OPERATOR_TYPES`: 演算子の列挙型
- 型エクスポート: `PluginConfig`, `VisibilityRule`, `DisableRule`, `RuleBlock` 等

#### `dynamicSchema.ts`（方針策定済み、要調整）

**責務**: kintone アプリのフィールド情報を用いた動的バリデーション

- `createConfigSchema(fields)`: フィールド情報から動的 Zod スキーマを生成
- `validateBlocks()`: ルールブロック内の条件を検証
- `isOperatorCompatibleWithFieldType()`: 【未実装】演算子とフィールドタイプの互換性チェック

> **注意**: `dynamicSchema.ts` のプロパティパスは `config.visibilityRules` / `config.disableRules` で
> `staticSchema.ts` と整合済み。ただし `FieldInfo` 型の解決と `isOperatorCompatibleWithFieldType()` の実装が未完了。

#### `persistence.ts` ✅（実装済み）

**責務**: 設定の保存・復元・マイグレーション

- `createConfig()`: デフォルト設定の生成
- `storeConfig()`: kintone への保存
- `restoreConfig()`: kintone からの復元（Zod 検証付き）
- `migrateConfig()`: 旧バージョンからのマイグレーション

### 4.2 shared/lib — 実行エンジン

#### `ruleEvaluator.ts`（基礎実装済み、拡張予定）

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

#### `disableExecutor.ts` ✅（スキーマ整合済み）

**責務**: 条件一致時に `event.record[fieldCode].disabled = true` を設定

- ルール単位の `enabled` チェックにより、個別ルールの有効/無効を制御

#### `visibilityExecutor.ts` ✅（スキーマ整合済み）

**責務**: 条件一致時に `kintone.app.record.setFieldShown(fieldCode, false)` を呼び出し

- ルール単位の `enabled` チェックにより、個別ルールの有効/無効を制御

### 4.3 desktop/mobile — エントリポイント

#### `desktop/index.ts` ✅（スキーマ整合済み）

**責務**: PC 向けイベントハンドラの登録

```typescript
const pluginConfig = restoreConfig();
executeDisable(pluginConfig.disableRules, event);
executeVisibility(pluginConfig.visibilityRules, event);
```

- ルール単位の `enabled` による有効/無効判定は Executor 側で実施

#### `mobile/index.ts` ✅（スキーマ整合済み）

**責務**: モバイル向けイベントハンドラの登録（`desktop/index.ts` と同構造）

### 4.4 config/ — 設定画面

#### コンポーネント階層（目標）

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
                            ├── [Tab 0] InvisibleSettings  ← 【未実装】
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
                            └── [Tab 1] DisableSettings    ← 【未実装】
                                └── RuleList（同上の構造）
```

---

## 5. 未実装モジュールの設計方針

### 5.1 `InvisibleSettings.tsx` / `DisableSettings.tsx`

**共通構造**: 両コンポーネントはほぼ同一の UI 構造を持つため、共通の `RuleSettingsBase` パターンを検討する。

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

### 5.2 `RuleCard.tsx`

**1ルール単位の設定カード**

| セクション | UI要素 | データパス |
|-----------|--------|-----------|
| 有効/無効 | スイッチ | `visibilityRules[i].enabled` |
| トリガー | マルチセレクト | `visibilityRules[i].block.triggers` |
| 条件 | 動的フォームリスト | `visibilityRules[i].block.conditions` |
| ロジック | AND/OR トグル | `visibilityRules[i].block.logic` |
| 対象フィールド | フィールドピッカー | `visibilityRules[i].targetFields` |

### 5.3 `ConditionRow.tsx`

**1条件行の設定フォーム**

```
┌────────────┐ ┌──────────┐ ┌──────────────┐ ┌───┐
│ フィールド   │ │ 演算子    │ │ 値           │ │ × │
│ (Autocomplete)│ │(Select) │ │(Text/Select) │ │   │
└────────────┘ └──────────┘ └──────────────┘ └───┘
```

**動的な振る舞い**:
- フィールド選択時に、そのフィールドタイプに応じた演算子リストをフィルタリング
- フィールドタイプに応じて値入力の UI を切り替え（テキスト入力 / ドロップダウン等）

### 5.4 `useRuleActions.ts`

**ルールの CRUD 操作を管理するカスタムフック**

```typescript
type UseRuleActionsReturn = {
  appendRule: () => void;           // ルール追加
  removeRule: (index: number) => void; // ルール削除
  moveRule: (from: number, to: number) => void; // ルール並び替え
  duplicateRule: (index: number) => void; // ルール複製
};
```

### 5.5 `useConditionActions.ts`

**条件の CRUD 操作を管理するカスタムフック**

```typescript
type UseConditionActionsReturn = {
  appendCondition: (ruleIndex: number) => void;
  removeCondition: (ruleIndex: number, condIndex: number) => void;
};
```

### 5.6 `isOperatorCompatibleWithFieldType()`

**演算子とフィールドタイプの互換性マップ**

```typescript
const OPERATOR_COMPATIBILITY: Record<FieldType, OPERATOR_TYPES[]> = {
  SINGLE_LINE_TEXT: ['equals', 'notEquals', 'includes', 'notIncludes'],
  NUMBER:          ['equals', 'notEquals', 'greaterThan', 'lessThan', 'greaterThanOrEqual', 'lessThanOrEqual'],
  DATE:            ['equals', 'notEquals', 'greaterThan', 'lessThan', 'greaterThanOrEqual', 'lessThanOrEqual'],
  DROP_DOWN:       ['equals', 'notEquals'],
  CHECK_BOX:       ['includes', 'notIncludes'],
  RADIO_BUTTON:    ['equals', 'notEquals'],
  MULTI_SELECT:    ['includes', 'notIncludes'],
  // ... 他フィールドタイプ
};
```

---

## 6. スキーマと既存コードの不整合一覧

以下は `staticSchema.ts` のスキーマ構造と、既存の実行コードとの間に検出された不整合点です。

| # | 対象ファイル | ステータス | 不整合内容 | 修正方針 |
|---|-------------|:---------:|-----------|---------|
| 1 | `desktop/index.ts` | ✅ 整合済み | プロパティパス `visibilityRules` / `disableRules` | スキーマと一致 |
| 2 | `mobile/index.ts` | ✅ 整合済み | プロパティパス `visibilityRules` / `disableRules` | スキーマと一致 |
| 3 | `disableExecutor.ts` | ✅ 整合済み | `rule.enabled` がスキーマに存在 | ルール単位 `enabled` 追加により解消 |
| 4 | `visibilityExecutor.ts` | ✅ 整合済み | `rule.enabled` がスキーマに存在 | ルール単位 `enabled` 追加により解消 |
| 5 | `dynamicSchema.ts` | ✅ 整合済み | プロパティパス `visibilityRules` / `disableRules` | スキーマと一致 |
| 6 | `dynamicSchema.ts` | ⚠️ 未解決 | `isOperatorCompatibleWithFieldType()` が未定義で使用されている | 関数を実装するか、import を追加 |
| 7 | `dynamicSchema.ts` | ⚠️ 未解決 | `FieldInfo` 型が未定義 | `FieldProperty`（`@kintone-plugin/kintone-utils`）を使用するよう修正 |
| 8 | `persistence.ts` | ⚠️ 要修正 | `createConfig()` が旧構造（`visibilitySetting` / `disableSetting`）を返却 | 新構造（`visibilityRules` / `disableRules`）に合わせて修正 |

---

## 7. 型定義の依存関係

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

## 8. 実行フロー

### 8.1 設定保存フロー

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

### 8.2 実行フロー（Desktop / Mobile）

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

## 9. 実装優先度とタスクリスト

### Phase 1: スキーマ整合性の修正（最優先）

- [x] ~~`desktop/index.ts` のパス参照を修正~~ → スキーマ変更により整合済み
- [x] ~~`mobile/index.ts` のパス参照を修正~~ → スキーマ変更により整合済み
- [x] ~~`disableExecutor.ts` の `rule.enabled` 整合~~ → スキーマにルール単位 `enabled` 追加により解消
- [x] ~~`visibilityExecutor.ts` の `rule.enabled` 整合~~ → スキーマにルール単位 `enabled` 追加により解消
- [x] ~~`dynamicSchema.ts` のパス参照を修正~~ → スキーマ変更により整合済み
- [ ] `dynamicSchema.ts` の `FieldInfo` → `FieldProperty` 型の修正
- [ ] `dynamicSchema.ts` の `isOperatorCompatibleWithFieldType()` を実装
- [ ] `persistence.ts` の `createConfig()` を新スキーマ構造に合わせて修正

### Phase 2: ルール評価エンジンの拡充

- [ ] `ruleEvaluator.ts` に全演算子の評価ロジックを実装
  - `greaterThan`, `lessThan`, `greaterThanOrEqual`, `lessThanOrEqual`
  - `notIncludes`
  - 配列値（複数選択）の `includes` / `notIncludes`
- [ ] 型安全な `Event` 型の定義（`Record<string, any>` の改善）

### Phase 3: 設定画面 UI の実装

- [ ] `InvisibleSettings.tsx` の実装
- [ ] `DisableSettings.tsx` の実装
- [ ] `RuleCard.tsx` の実装
- [ ] `RuleList.tsx` の実装（dnd-kit による並び替え対応）
- [ ] `ConditionRow.tsx` の実装
- [ ] `ConditionList.tsx` の実装
- [ ] `TriggerSelect.tsx` の実装
- [ ] `FieldSelect.tsx` の実装（kintone フィールド一覧から選択）
- [ ] `useRuleActions.ts` の実装
- [ ] `useConditionActions.ts` の実装

### Phase 4: テストと品質向上

- [ ] 各演算子の評価ロジックの単体テスト
- [ ] スキーマバリデーションの単体テスト
- [ ] 設定画面の E2E テスト
- [ ] エッジケースの検証（空条件、未設定フィールド等）

---

## 10. 設計上の判断ポイント

### 10.1 ルール単位の `enabled` 制御 ✅（決定済み）

**決定**: Setting ラッパー（`visibilitySetting` / `disableSetting`）を廃止し、
ルール単位に `enabled: z.boolean()` を持つフラット構造を採用。

**メリット**:
- 個別ルールの一時無効化が可能（デバッグ・段階的な設定展開に有用）
- Setting ラッパーが不要になり、スキーマとアクセスパスがシンプル化
- Executor 側の `rule.enabled` チェックとの整合性が確保

**構造比較**:
```
// 旧: Setting ラッパー構造
pluginConfig.visibilitySetting.enabled  // 設定全体の有効/無効
pluginConfig.visibilitySetting.rules[i] // 個別ルール

// 新: フラット + ルール単位 enabled
pluginConfig.visibilityRules[i].enabled // ルール単位の有効/無効
```

### 10.2 条件値（`value`）の型設計

**現状**: `z.union([z.string(), z.array(z.string())])`

- `string`: 単一値の比較（文字列、数値、日付）
- `string[]`: 複数値の比較（チェックボックス、複数選択）

この設計は適切。フィールドタイプに応じた動的バリデーションで補完する。

### 10.3 マイグレーション戦略

`persistence.ts` にバージョンマイグレーション機構が組み込まれているため、
将来のスキーマ変更にも `LATEST_PLUGIN_VERSION` のインクリメントと
`migrateConfig()` へのステップ追加で対応可能。
