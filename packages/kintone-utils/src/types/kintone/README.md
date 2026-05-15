# Kintone 型定義

Kintone JavaScript API の TypeScript 型定義集です。

## 📁 ファイル構成

```
kintone/
├── index.ts       # エクスポート統合
├── field.ts       # フィールド値の型定義
├── record.ts      # レコード型定義
├── utils.ts       # ユーティリティ型
├── events.ts      # イベント型定義（declare global）
├── global.ts      # グローバルAPI型定義（declare global）
├── global.d.ts    # グローバル型定義エントリーポイント
└── README.md      # このファイル
```

## 🎯 使用方法

### グローバル型定義の自動読み込み

`@kintone-plugin/kintone-utils`パッケージは、**インポートなしで**グローバル型定義を提供します。

```typescript
// インポート不要！
kintone.events.on(['app.record.create.show'], (event) => {
  const user = kintone.getLoginUser();
  const appId = kintone.app.getId();
  return event;
});
```

**設定方法**：

```jsonc
// tsconfig.json
{
  "compilerOptions": {
    "types": ["@kintone-plugin/kintone-utils"]
  }
}
```

### 基本的なインポート

型定義を明示的に使用する場合：

```typescript
import type { KintoneRecord, BuildRecord } from '@kintone-plugin/kintone-utils';
```

### フィールド型の使用

```typescript
import type { FieldMap } from '@kintone-plugin/kintone-utils';

// 特定のフィールドタイプを取得
type SingleLineTextField = FieldMap['SINGLE_LINE_TEXT']['get'];
```

### レコード型の使用

```typescript
// 汎用レコード型
const record: KintoneRecord = {
  $id: { type: '__ID__', value: '1' },
  $revision: { type: '__REVISION__', value: '1' },
  name: { type: 'SINGLE_LINE_TEXT', value: 'John Doe' },
};

// スキーマベースのレコード型
type AppSchema = {
  properties: {
    name: { type: 'SINGLE_LINE_TEXT' };
    age: { type: 'NUMBER' };
  };
};

const typedRecord: BuildRecord<AppSchema> = {
  $id: { type: '__ID__', value: '1' },
  $revision: { type: '__REVISION__', value: '1' },
  name: { type: 'SINGLE_LINE_TEXT', value: 'John Doe' },
  age: { type: 'NUMBER', value: '30' },
};
```

### イベント型の使用

```typescript
// グローバル型定義（推奨）
kintone.events.on('app.record.detail.show', (event) => {
  // event は AppRecordDetailShowEvent 型として推論される
  console.log(event.record);
  return event;
});
```

### フィールドの編集可否とエラー表示

```typescript
kintone.events.on(['app.record.create.show'], (event) => {
  // ✅ 対応フィールド：disabled/error が使える
  const textField = event.record.myTextField;
  if (textField) {
    textField.disabled = true;
    textField.error = 'このフィールドは必須です';
  }

  // ❌ 非対応フィールド：型エラーになる
  const idField = event.record.$id;
  if (idField) {
    // idField.disabled = true; // 型エラー！
  }

  return event;
});
```

**対応フィールド**：
- テキスト系: `SINGLE_LINE_TEXT`, `LINK`, `MULTI_LINE_TEXT`, `RICH_TEXT`
- 数値: `NUMBER`
- 日時: `DATE`, `TIME`, `DATETIME`
- 選択: `RADIO_BUTTON`, `DROP_DOWN`, `CHECK_BOX`, `MULTI_SELECT`
- ユーザー選択: `USER_SELECT`, `GROUP_SELECT`, `ORGANIZATION_SELECT`
- その他: `FILE`, `CATEGORY`

**非対応フィールド**（型システムで制限）：
- システムフィールド: `__ID__`, `__REVISION__`, `RECORD_NUMBER`, `CREATOR`, `CREATED_TIME`, `MODIFIER`, `UPDATED_TIME`
- ステータス関連: `STATUS`, `STATUS_ASSIGNEE`
- 計算: `CALC`

## 📝 型定義の特徴

### 1. **フィールド型（field.ts）**
- レコードフィールドの値の型定義
- `get`（取得）と `set`（設定）の2つのモードをサポート
- システムフィールドからユーザー定義フィールドまで網羅
- `FieldProperty`インターフェース（`disabled`, `error`）を型レベルで制御
- `WithFieldProperty<T, FieldType>`ヘルパー型で対応フィールドのみに適用

### 2. **レコード型（record.ts）**
- `KintoneRecord`: 汎用レコード型
- `KintoneRecordForSet`: レコード設定用
- `KintoneRecordOnCreatePage`: 作成画面用
- `BuildRecord<AppSchema>`: スキーマベースの型生成

### 3. **ユーティリティ型（utils.ts）**
- `RemoveNeverProperties`: never型プロパティの除外
- `InSubtableFieldType`: サブテーブル内で使用可能なフィールドタイプ
- `ChangeEventSupportedFieldType`: 変更イベント対応フィールドタイプ
- `CreatePageFieldType`: 作成画面で使用可能なフィールドタイプ

### 4. **イベント型（events.ts）**
- 詳細なイベント型定義（`declare global`内）
- `kintone.events.EventMap`インターフェース
- 各イベントの詳細な型定義

### 5. **グローバルAPI型（global.ts）**
- `kintone.*` 名前空間の型定義
- `kintone.app.*` 名前空間の型定義
- `kintone.plugin.*` 名前空間の型定義
- `kintone.events.*` 名前空間の型定義

## 🎨 ベストプラクティス

### 1. スキーマベースの型を使用する

```typescript
// ❌ 汎用型（型安全性が低い）
const record: KintoneRecord = kintone.app.record.get()?.record;

// ✅ スキーマベースの型（型安全性が高い）
type MyAppSchema = {
  properties: {
    name: { type: 'SINGLE_LINE_TEXT' };
    age: { type: 'NUMBER' };
  };
};

const record = kintone.app.record.get<MyAppSchema>()?.record;
// record.name は型推論される
```

### 2. イベントハンドラーで型を活用する

```typescript
// ✅ 型安全なイベントハンドラー
kintone.events.on('app.record.detail.show', (event) => {
  // event.record は BuildRecord<AppSchema> 型
  const name = event.record.name?.value;
  return event;
});
```

### 3. 動的フィールドアクセスには型ガードを使用

```typescript
// ✅ 型ガードで安全にアクセス
const field = record[fieldCode];

if (!field) return;

if ('disabled' in field) {
  field.disabled = true;
}

if ('value' in field) {
  field.value = 'new value';
}
```

### 4. ユーティリティ型を活用する

```typescript
import type { RemoveNeverProperties } from '@kintone-plugin/kintone-utils';

// never型のプロパティを除外
type CleanType = RemoveNeverProperties<{
  a: string;
  b: never;
  c: number;
}>;
// => { a: string; c: number }
```

## 📚 参考リンク

- [Kintone JavaScript API ドキュメント](https://cybozu.dev/ja/kintone/docs/js-api/)
- [Kintone REST API ドキュメント](https://cybozu.dev/ja/kintone/docs/rest-api/)
