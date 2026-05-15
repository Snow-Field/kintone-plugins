# {{プラグイン名}} — 実装タスクリスト

> **最終更新**: 2026-05-15
> **参照**: [DESIGN.md](./DESIGN.md)

---

## Phase 1: スキーマ・設定基盤

- [x] `staticSchema.ts` の定義
- [x] `dynamicSchema.ts` の定義
- [x] `persistence.ts` の実装（`createConfig`, `storeConfig`, `restoreConfig`, `migrateConfig`）

## Phase 2: 実行ロジック

- [ ] `desktop/index.ts` のイベントハンドラ実装
- [ ] `mobile/index.ts` のイベントハンドラ実装
- [ ] `shared/lib/` 配下のビジネスロジック実装

## Phase 3: 設定画面 UI

- [ ] 設定画面コンポーネントの実装
- [ ] カスタムフックの実装

## Phase 4: テストと品質向上

- [ ] バリデーションの単体テスト
- [ ] ビジネスロジックの単体テスト
- [ ] 設定画面の E2E テスト
- [ ] エッジケースの検証
