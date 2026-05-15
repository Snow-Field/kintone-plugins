# {{プラグイン名}} — 実装タスクリスト

> **最終更新**: 2026-05-15
> **参照**: [DESIGN.md](./DESIGN.md)

---

## Phase 1: スキーマ・設定基盤

- [x] `staticSchema.ts` の定義
- [x] `dynamicSchema.ts` の定義
- [x] `persistence.ts` の実装（`createConfig`, `storeConfig`, `restoreConfig`, `migrateConfig`）

## Phase 2: 実行ロジック

- [x] `desktop/index.ts` のイベントハンドラ実装
- [x] `mobile/index.ts` のイベントハンドラ実装
- [x] `shared/feature/numbering/` 配下のビジネスロジック実装
  - [x] `core/numberingEngine.ts` - 採番処理のオーケストレーション
  - [x] `services/formatService.ts` - フォーマット処理
  - [x] `services/recordService.ts` - レコード操作（RestAPIClient）
  - [x] `services/serialService.ts` - 連番管理
  - [x] `utils/date.ts` - 日付処理
  - [x] `utils/string.ts` - 文字列処理

## Phase 3: 設定画面 UI

- [ ] 設定画面コンポーネントの実装
- [ ] カスタムフックの実装

## Phase 4: テストと品質向上

- [ ] バリデーションの単体テスト
- [ ] ビジネスロジックの単体テスト
- [ ] 設定画面の E2E テスト
- [ ] エッジケースの検証
