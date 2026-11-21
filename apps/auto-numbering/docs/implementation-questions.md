# 実装方針の確定事項

> **作成日**: 2026-05-29
> **更新日**: 2026-05-29
> **Phase 3（設定画面 UI）の実装方針**

---

## ✅ 確定事項

### 1. UI/UX の方針

#### 1.1 フォーマットパーツの編集方法
**決定**: **リスト形式（上下ボタンで並び替え）**
- field-controller を参考にシンプルな実装
- 将来的にドラッグ&ドロップに拡張可能

#### 1.2 プレビュー表示のタイミング
**決定**: **リアルタイム更新**
- フォーム値が変更されるたびに自動更新
- `useMemo` や `debounce` でパフォーマンス最適化

#### 1.3 複数設定の表示方法
**決定**: **Accordion（折りたたみ）**
- field-controller の RuleCard を踏襲
- dnd-kit でドラッグ&ドロップによる並び替えに対応

---

### 2. データ設計

#### 2.1 設定の識別方法
**決定**: **各設定に一意の ID を付与**
```typescript
type NumberingSetting = {
  id: string;  // nanoid で生成
  // ...
};
```
- React の key として使用
- 設定の削除・並び替え時の安定性向上

#### 2.2 設定の表示名
**決定**: **ユーザーが任意の名前を設定可能**
```typescript
type NumberingSetting = {
  id: string;
  label?: string;  // 例: "営業部採番"、"開発部採番"
  enabled: boolean;  // 有効/無効フラグ（field-controller を踏襲）
  // ...
};
```
- オプション項目として追加（未入力時は「設定 N」と自動生成）
- field-controller の enabled フラグも追加

---

### 3. パフォーマンス

#### 3.1 設定数の上限
**決定**: **5 件に制限**
- バリデーションで上限チェック
- 実用上十分な件数

---

### 4. バリデーション

#### 4.1 実行タイミング
**決定**: **onBlur + 送信時**
- field-controller を踏襲
- React Hook Form の `mode: 'onBlur'` を使用

#### 4.2 エラー表示の方法
**決定**: **インラインエラー + サマリーの併用**
- field-controller を踏襲
- React Hook Form のデフォルト動作（インラインエラー）
- MUI の `Alert` コンポーネントでサマリー表示

---

### 5. フィールド情報の取得

#### 5.1 取得タイミング
**決定**: **初期表示時に一度だけ + 手動リフレッシュボタン**
- field-controller を踏襲
- 通常は初期取得で十分
- 必要に応じて「フィールド情報を更新」ボタンで再取得

---

## 📋 実装計画

### Phase 3.4 の実装順序（field-controller を参考）

1. **基本構造の実装**
   - `NumberingSettingsList.tsx`（dnd-kit でドラッグ&ドロップ対応）
   - `NumberingSettingCard.tsx`（field-controller の RuleCard を参考）

2. **個別コンポーネントの実装**
   - `ResultFieldSelector.tsx`（field-controller の FieldSelect を参考）
   - `ConnectorSelector.tsx`
   - `SerialConfigEditor.tsx`

3. **フォーマットパーツの実装**
   - `FormatPartsList.tsx`（リスト形式、上下ボタン）
   - `FormatPartItem.tsx`（type 別の UI）

4. **プレビュー機能の実装**
   - `PreviewDisplay.tsx`（リアルタイム更新）
   - `useNumberingPreview.ts`

5. **動的バリデーションの統合**
   - `useAppFields.ts`（field-controller を参考）
   - `dynamicSchema.ts` の拡張

6. **UI/UX の改善**
   - エラー表示の統合
   - ローディング状態
   - スナックバー通知

---

## 🎯 field-controller から踏襲する要素

### コンポーネント構造
- `RuleList` → `NumberingSettingsList`（dnd-kit 使用）
- `RuleCard` → `NumberingSettingCard`（Accordion 形式）
- `FieldSelect` → `ResultFieldSelector` / `FieldSelector`

### フック
- `useRuleActions` → `useNumberingActions`（createDefaultNumberingSetting）
- `useAppFields`（フィールド情報取得）

### バリデーション
- `dynamicSchema.ts` の `superRefine` パターン
- フィールド存在チェック
- フィールド型チェック

### UI パターン
- Accordion でのカード表示
- 有効/無効スイッチ
- 複製・削除ボタン
- ドラッグハンドル

---

## 🚀 次のステップ

1. **スキーマ変更の確認**: ✅ 完了
   - `id`, `label`, `enabled` を追加
   - 最大 5 件の制限を追加

2. **useNumberingActions の作成**: ✅ 完了
   - `createDefaultNumberingSetting` 関数

3. **NumberingSettingsList の実装**: 次のタスク
   - field-controller の RuleList を参考
   - dnd-kit でドラッグ&ドロップ対応

4. **NumberingSettingCard の実装**
   - field-controller の RuleCard を参考
   - 有効/無効スイッチ、複製・削除ボタン

5. **個別コンポーネントの実装**
   - ResultFieldSelector, ConnectorSelector, SerialConfigEditor

6. **フォーマットパーツエディターの実装**
   - FormatPartsList, FormatPartItem

7. **プレビュー機能の実装**
   - PreviewDisplay, useNumberingPreview

8. **動的バリデーションの統合**
   - dynamicSchema の拡張
