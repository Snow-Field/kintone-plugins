# 実装方針サマリー

> **作成日**: 2026-05-29
> **Phase 3（設定画面 UI）実装開始前の最終確認**

---

## ✅ 確定事項

### 1. データスキーマの変更

#### NumberingSetting に追加されたフィールド

```typescript
type NumberingSetting = {
  id: string;              // ✅ 追加: 一意識別子（nanoid）
  label?: string;          // ✅ 追加: 表示名（オプション）
  enabled: boolean;        // ✅ 追加: 有効/無効フラグ
  resultFieldCode: string;
  formatParts: FormatPart[];
  connector: Connectors;
  serialConfig: SerialConfig;
};
```

#### 設定数の制限

```typescript
numberingSettings: z
  .array(NumberingSettingsSchema)
  .min(1, '採番設定を1つ以上追加してください')
  .max(5, '採番設定は最大5件までです'),  // ✅ 5件に制限
```

---

### 2. UI/UX の方針

| 項目 | 決定内容 | 参考元 |
|------|---------|--------|
| **複数設定の表示** | Accordion（折りたたみ） | field-controller の RuleCard |
| **設定の並び替え** | ドラッグ&ドロップ（dnd-kit） | field-controller の RuleList |
| **有効/無効切り替え** | Switch コンポーネント | field-controller |
| **複製・削除ボタン** | カードヘッダーに配置 | field-controller |
| **フォーマットパーツ編集** | リスト形式（上下ボタン） | シンプル実装優先 |
| **プレビュー表示** | リアルタイム更新 | ユーザー要望 |

---

### 3. バリデーション方針

| 項目 | 決定内容 | 参考元 |
|------|---------|--------|
| **実行タイミング** | onBlur + 送信時 | field-controller |
| **エラー表示** | インラインエラー + サマリー | field-controller |
| **動的バリデーション** | superRefine パターン | field-controller の dynamicSchema |
| **フィールド情報取得** | 初期表示時 + 手動リフレッシュ | field-controller |

---

### 4. コンポーネント構成

#### field-controller からの踏襲

| field-controller | auto-numbering | 役割 |
|------------------|----------------|------|
| `RuleList` | `NumberingSettingsList` | 設定一覧（dnd-kit） |
| `RuleCard` | `NumberingSettingCard` | 個別設定カード |
| `FieldSelect` | `ResultFieldSelector` | フィールド選択 |
| `useRuleActions` | `useNumberingActions` | デフォルト設定生成 |
| `dynamicSchema` | `dynamicSchema` | 動的バリデーション |

#### auto-numbering 固有のコンポーネント

| コンポーネント | 役割 |
|---------------|------|
| `ConnectorSelector` | 区切り文字選択 |
| `SerialConfigEditor` | 連番設定 |
| `FormatPartsList` | フォーマットパーツ一覧 |
| `FormatPartItem` | 個別パーツ（text/field/date） |
| `PreviewDisplay` | 採番プレビュー |

---

## 📋 実装順序

### Phase 3.4: 機能別コンポーネント

#### Step 1: 基本構造（field-controller を参考）
- [x] `useNumberingActions.ts` - デフォルト設定生成
- [ ] `NumberingSettingsList.tsx` - 設定一覧（dnd-kit）
- [ ] `NumberingSettingCard.tsx` - 個別設定カード

#### Step 2: 個別セレクター
- [ ] `ResultFieldSelector.tsx` - 採番結果フィールド選択
- [ ] `ConnectorSelector.tsx` - 区切り文字選択
- [ ] `SerialConfigEditor.tsx` - 連番設定

#### Step 3: フォーマットパーツ
- [ ] `FormatPartsList.tsx` - パーツ一覧（上下ボタン）
- [ ] `FormatPartItem.tsx` - 個別パーツ（type 別 UI）

#### Step 4: プレビュー機能
- [ ] `PreviewDisplay.tsx` - プレビュー表示
- [ ] `useNumberingPreview.ts` - プレビュー生成ロジック

#### Step 5: 動的バリデーション
- [ ] `useAppFields.ts` - フィールド情報取得
- [ ] `dynamicSchema.ts` の拡張 - フィールド存在チェック

#### Step 6: UI/UX 改善
- [ ] エラー表示の統合
- [ ] ローディング状態
- [ ] スナックバー通知

---

## 🎯 実装のポイント

### field-controller から学ぶべき点

1. **dnd-kit の使い方**
   - `SortableContext` + `useSortable` でドラッグ&ドロップ
   - `PointerSensor` でタッチデバイス対応

2. **useFieldArray の使い方**
   - `fields`, `append`, `insert`, `remove`, `move` の活用
   - 二重呼び出しを避ける（親コンポーネントで一度だけ）

3. **動的バリデーション**
   - `superRefine` でフィールド情報を使った検証
   - エラーパスの正確な指定

4. **UI パターン**
   - Card ヘッダーに有効/無効スイッチ + 操作ボタン
   - Divider で視覚的なセクション分け
   - Tooltip でユーザーガイダンス

### auto-numbering 固有の考慮点

1. **プレビュー機能**
   - `formatService` を再利用してプレビュー生成
   - サンプルデータの用意
   - エラー時の適切な表示

2. **フォーマットパーツの複雑性**
   - type 別の UI 切り替え（text / field / date）
   - date パーツのフォーマットプレビュー
   - field パーツのフィールド型フィルタリング

3. **連番設定の条件分岐**
   - `resetTiming` が 'none' の場合のみ `serialFieldCode` を表示
   - 数値フィールドのみ選択可能

---

## 🚀 次のアクション

1. **NumberingSettingsList の実装**
   - field-controller の `RuleList.tsx` を参考
   - dnd-kit の導入と設定

2. **NumberingSettingCard の実装**
   - field-controller の `RuleCard.tsx` を参考
   - 有効/無効スイッチ、複製・削除ボタン

3. **個別コンポーネントの実装**
   - ResultFieldSelector, ConnectorSelector, SerialConfigEditor

---

## 📚 参考ファイル

### field-controller
- `apps/field-controller/src/config/components/features/rule/RuleList.tsx`
- `apps/field-controller/src/config/components/features/rule/RuleCard.tsx`
- `apps/field-controller/src/config/components/features/rule/FieldSelect.tsx`
- `apps/field-controller/src/config/hooks/useRuleActions.ts`
- `apps/field-controller/src/shared/config/dynamicSchema.ts`

### auto-numbering（既存実装）
- `apps/auto-numbering/src/shared/config/staticSchema.ts`
- `apps/auto-numbering/src/shared/config/persistence.ts`
- `apps/auto-numbering/src/config/hooks/useNumberingActions.ts`
- `apps/auto-numbering/src/shared/feature/numbering/services/formatService.ts`

---

**実装準備完了！Phase 3.4 の実装を開始できます。**
