# 自動採番プラグイン — 実装タスクリスト

> **最終更新**: 2026-05-29
> **参照**: [DESIGN.md](./DESIGN.md)

---

## ✅ Phase 1: スキーマ・設定基盤（完了）

- [x] `staticSchema.ts` の定義
- [x] `dynamicSchema.ts` の定義
- [x] `persistence.ts` の実装（`createConfig`, `storeConfig`, `restoreConfig`, `migrateConfig`）

## ✅ Phase 2: 実行ロジック（完了）

- [x] `desktop/index.ts` のイベントハンドラ実装
- [x] `mobile/index.ts` のイベントハンドラ実装
- [x] `shared/feature/numbering/` 配下のビジネスロジック実装
  - [x] `core/numberingEngine.ts` - 採番処理のオーケストレーション
  - [x] `services/formatService.ts` - フォーマット処理
  - [x] `services/recordService.ts` - レコード操作（RestAPIClient）
  - [x] `services/serialService.ts` - 連番管理
  - [x] `utils/date.ts` - 日付処理
  - [x] `utils/string.ts` - 文字列処理

## 🚧 Phase 3: 設定画面 UI（進行中）

### 3.1 基盤コンポーネント
- [x] `config/index.tsx` - エントリーポイント
- [x] `config/App.tsx` - ルートコンポーネント
- [x] `config/components/PluginContent.tsx` - メインコンテナ
- [x] `config/components/PluginErrorBoundary.tsx` - エラーバウンダリ

### 3.2 カスタムフック
- [x] `hooks/usePluginForm.ts` - フォーム初期化
- [x] `hooks/useSubmitConfig.ts` - 保存処理
- [x] `hooks/useResetConfig.ts` - リセット処理
- [x] `hooks/useImportConfig.ts` - インポート処理
- [x] `hooks/useExportConfig.ts` - エクスポート処理
- [x] `hooks/useSyncConfig.ts` - 状態同期

### 3.3 状態管理
- [x] `states/store.ts` - Jotai ストア
- [x] `states/plugin.ts` - プラグイン状態 atom

### 3.4 機能別コンポーネント
- [x] `features/FormTabs.tsx` - タブナビゲーション
- [x] `features/GeneralSettings.tsx` - 共通設定（APIトークン）
- [x] `features/NumberingSettings/` - 採番設定セクション
  - [x] `NumberingSettingsList.tsx` - 採番設定一覧（追加・削除・並び替え）
  - [x] `NumberingSettingCard.tsx` - 個別採番設定フォーム
  - [x] `ResultFieldSelector.tsx` - 採番結果フィールド選択
  - [x] `FormatPartsList.tsx` - フォーマットパーツ編集
  - [x] `FormatPartItem.tsx` - 個別パーツ（text / field / date）
  - [x] `ConnectorSelector.tsx` - 区切り文字選択
  - [x] `SerialConfigEditor.tsx` - 連番設定
  - [x] `PreviewDisplay.tsx` - 採番プレビュー表示

### 3.5 カスタムフック
- [x] `hooks/useNumberingActions.ts` - デフォルト設定生成
- [x] `hooks/useNumberingPreview.ts` - プレビュー生成ロジック

### 3.6 UI 統合
- [x] フォーム全体の統合とレイアウト調整
- [x] バリデーションエラー表示の実装（React Hook Form）
- [x] ローディング状態の実装
  - [x] 保存時のローディング（既存実装）
  - [x] フィールド情報取得中のローディング（Suspense）
- [x] スナックバー通知の実装
  - [x] 保存成功/失敗の通知（既存実装）
  - [x] インポート成功/失敗の通知（既存実装）
  - [x] エクスポート成功の通知（既存実装）

---

## 📝 実装メモ

### 実装方針の確定事項

#### UI/UX
- **プレビュー表示**: リアルタイム更新（debounce で最適化）
- **複数設定表示**: Accordion（field-controller を踏襲）
- **フォーマットパーツ編集**: リスト形式（上下ボタンで並び替え）
- **ドラッグ&ドロップ**: 採番設定の並び替えに使用（dnd-kit）

#### データ設計
- **設定の識別**: 各設定に一意の ID を付与（nanoid）
- **表示名**: `label` フィールドを追加（オプション、未入力時は「設定 N」と表示）
- **有効/無効**: `enabled` フラグを追加（field-controller を踏襲）

#### パフォーマンス
- **設定数の上限**: 5 件に制限

#### バリデーション
- **実行タイミング**: onBlur + 送信時（field-controller を踏襲）
- **エラー表示**: インラインエラー + サマリーの併用

### 優先度の高いタスク
1. **採番設定 UI の実装**（Phase 3.4）
   - 複数設定の管理（追加・削除・並び替え）
   - フォーマットパーツの動的編集
   - リアルタイムプレビュー

2. **動的バリデーションの統合**
   - kintone フィールド情報の取得
   - フィールド存在チェック
   - フィールド型チェック

3. **エラーハンドリングの強化**
   - ユーザーフレンドリーなエラーメッセージ
   - リトライ可能なエラーの判定
   - ログ出力の整備

### 技術的な検討事項
- [ ] フォーマットパーツの UI/UX（ドラッグ&ドロップ vs リスト編集）
- [ ] プレビュー機能の実装方法（リアルタイム vs ボタンクリック）
- [ ] 大量設定時のパフォーマンス最適化
- [ ] モバイル対応の確認
