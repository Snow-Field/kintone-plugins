# Field Controller プラグイン — 実装タスクリスト

> **最終更新**: 2026-04-14
> **参照**: [DESIGN.md](./DESIGN.md)

---

## Phase 1: スキーマ整合性の修正 ✅ 完了

- [x] `desktop/index.ts` のパス参照を修正 → スキーマ変更により整合済み
- [x] `mobile/index.ts` のパス参照を修正 → スキーマ変更により整合済み
- [x] `disableExecutor.ts` の `rule.enabled` 整合 → スキーマにルール単位 `enabled` 追加により解消
- [x] `visibilityExecutor.ts` の `rule.enabled` 整合 → スキーマにルール単位 `enabled` 追加により解消
- [x] `dynamicSchema.ts` のパス参照を修正 → スキーマ変更により整合済み
- [x] `dynamicSchema.ts` の `FieldInfo` → `FieldProperty` 型の修正 → `KintoneFormFieldProperty.OneOf` を使用
- [x] `dynamicSchema.ts` の `isOperatorCompatibleWithFieldType()` を実装 → `OPERATOR_COMPATIBILITY` マップと共に実装
- [x] `persistence.ts` の `createConfig()` を新スキーマ構造に合わせて修正 → 新構造対応済み。`migrateConfig()` のテンプレート残骸も除去済み

## Phase 2: ルール評価エンジンの拡充

- [x] `ruleEvaluator.ts` に全演算子の評価ロジックを実装
  - `greaterThan`, `lessThan`, `greaterThanOrEqual`, `lessThanOrEqual`
  - `notIncludes`
  - 配列値（複数選択）の `includes` / `notIncludes`
- [x] 型安全な `Event` 型の定義（`Record<string, any>` の改善）

## Phase 3: 設定画面 UI の実装

- [ ] `InvisibleSettings.tsx` の実装
- [ ] `DisableSettings.tsx` の実装
- [ ] `RuleCard.tsx` の実装
- [ ] `RuleList.tsx` の実装（dnd-kit による並び替え対応）
- [ ] `ConditionRow.tsx` の実装
- [ ] `ConditionList.tsx` の実装
- [ ] `TriggerSelect.tsx` の実装
- [ ] `OperatorSelect.tsx` の実装
- [ ] `FieldSelect.tsx` の実装（kintone フィールド一覧から選択）
- [ ] `useRuleActions.ts` の実装
- [ ] `useConditionActions.ts` の実装

## Phase 4: テストと品質向上

- [ ] 各演算子の評価ロジックの単体テスト
- [ ] スキーマバリデーションの単体テスト
- [ ] 設定画面の E2E テスト
- [ ] エッジケースの検証（空条件、未設定フィールド等）
