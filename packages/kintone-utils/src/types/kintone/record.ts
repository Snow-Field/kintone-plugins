/**
 * Kintone レコード型定義
 * @module kintone/record
 */

import type { FieldMap } from './field';
import type {
  RemoveNeverProperties,
  InSubtableFieldType,
  ChangeEventSupportedFieldType,
  CreatePageFieldType,
} from './utils';

// ============================================================================
// フィールド型のエイリアス
// ============================================================================

type AnyFieldType = keyof FieldMap;
type AnyField = FieldMap[AnyFieldType];
type InSubtableField = FieldMap[InSubtableFieldType];
type CreatePageField = FieldMap[CreatePageFieldType];
type ChangeEventSupportedField = FieldMap[ChangeEventSupportedFieldType];

// ============================================================================
// サブテーブル型定義
// ============================================================================

/**
 * サブテーブルフィールド（取得用）
 *
 * @example
 * ```typescript
 * type MySubtable = Subtable<{
 *   name: { type: 'SINGLE_LINE_TEXT'; value: string };
 *   age: { type: 'NUMBER'; value: string };
 * }>;
 *
 * const subtable: MySubtable = {
 *   type: 'SUBTABLE',
 *   value: [
 *     {
 *       id: '1',
 *       value: {
 *         name: { type: 'SINGLE_LINE_TEXT', value: 'John' },
 *         age: { type: 'NUMBER', value: '30' }
 *       }
 *     }
 *   ]
 * };
 * ```
 */
export type Subtable<T> = {
  type: 'SUBTABLE';
  value: Array<{
    id: string | null;
    value: T;
  }>;
};

/**
 * サブテーブルフィールド（作成画面用）
 */
export type SubtableOnCreatePage<T> = {
  type: 'SUBTABLE';
  value: Array<{
    id: null;
    value: T;
  }>;
};

/**
 * サブテーブルフィールド（設定用）
 */
export type SubtableForSet<T> = {
  type: 'SUBTABLE';
  value: Array<{
    id: string | null;
    value: T;
  }>;
};

// ============================================================================
// レコード型定義
// ============================================================================

/**
 * Kintone レコード（取得用）
 */
export type KintoneRecord = {
  $id: FieldMap['__ID__']['get'];
  $revision: FieldMap['__REVISION__']['get'];
} & {
  [FieldCode in string]?:
    | AnyField['get']
    | Subtable<{
        [InSubtableFieldCode in string]?: InSubtableField['get'];
      }>;
};

/**
 * Kintone レコード（作成画面用）
 */
export type KintoneRecordOnCreatePage = {
  [FieldCode in string]?:
    | CreatePageField['get']
    | SubtableOnCreatePage<{
        [InSubtableFieldCode in string]?: (CreatePageField & InSubtableField)['get'];
      }>;
};

/**
 * Kintone レコード（設定用）
 */
export type KintoneRecordForSet = {
  [FieldCode in string]?:
    | AnyField['set']
    | SubtableForSet<{
        [InSubtableFieldCode in string]?: InSubtableField['set'];
      }>;
};

// ============================================================================
// 変更イベント関連型
// ============================================================================

/**
 * 変更されたフィールド
 */
export type ChangedField = ChangeEventSupportedField['get'];

/**
 * 変更されたサブテーブル
 */
export type ChangedSubtable = Subtable<{
  [fieldCode in string]?: InSubtableField['get'];
}>;

/**
 * 変更されたサブテーブル行
 */
export type ChangedRow = {
  id: string | null;
  value: {
    [fieldCode in string]?: InSubtableField['get'];
  };
};

// ============================================================================
// スキーマベースのレコード型ビルダー
// ============================================================================

/**
 * アプリスキーマからレコード型を生成（取得用）
 */
export type BuildRecord<AppSchema extends { properties: Record<string, any> }> =
  AppSchema extends unknown
    ? string extends keyof AppSchema['properties']
      ? KintoneRecord
      : {
          $id: FieldMap['__ID__']['get'];
          $revision: FieldMap['__REVISION__']['get'];
        } & RemoveNeverProperties<{
          [FieldCode in keyof AppSchema['properties']]: AppSchema['properties'][FieldCode] extends {
            type: 'SUBTABLE';
          }
            ? BuildSubtable<AppSchema['properties'][FieldCode]['fields']>
            : BuildField<AppSchema['properties'][FieldCode]>;
        }>
    : never;

/**
 * アプリスキーマからレコード型を生成（設定用）
 */
export type BuildRecordForSet<AppSchema extends { properties: Record<string, any> }> =
  AppSchema extends unknown
    ? string extends keyof AppSchema['properties']
      ? KintoneRecordForSet
      : RemoveNeverProperties<{
          [FieldCode in keyof AppSchema['properties']]?: AppSchema['properties'][FieldCode] extends {
            type: 'SUBTABLE';
          }
            ? BuildSubtableForSet<AppSchema['properties'][FieldCode]['fields']>
            : BuildFieldForSet<AppSchema['properties'][FieldCode]>;
        }>
    : never;

/**
 * アプリスキーマからレコード型を生成（作成画面用）
 */
export type BuildRecordOnCreatePage<AppSchema extends { properties: Record<string, any> }> =
  AppSchema extends unknown
    ? string extends keyof AppSchema['properties']
      ? KintoneRecordOnCreatePage
      : RemoveNeverProperties<{
          [FieldCode in keyof AppSchema['properties']]: AppSchema['properties'][FieldCode] extends {
            type: 'SUBTABLE';
          }
            ? BuildSubtableOnCreatePage<AppSchema['properties'][FieldCode]['fields']>
            : BuildFieldOnCreatePage<AppSchema['properties'][FieldCode]>;
        }>
    : never;

// ============================================================================
// 内部ヘルパー型
// ============================================================================

type BuildSubtable<Internal> = Subtable<
  RemoveNeverProperties<{
    [FieldCode in keyof Internal]: BuildField<Internal[FieldCode]>;
  }>
>;

type BuildSubtableForSet<Internal> = SubtableForSet<
  RemoveNeverProperties<{
    [FieldCode in keyof Internal]?: BuildFieldForSet<Internal[FieldCode]>;
  }>
>;

type BuildSubtableOnCreatePage<Internal> = SubtableOnCreatePage<
  RemoveNeverProperties<{
    [FieldCode in keyof Internal]: BuildFieldOnCreatePage<Internal[FieldCode]>;
  }>
>;

type BuildField<FieldProperty> = FieldProperty extends { type: AnyFieldType }
  ? FieldProperty extends { type: 'STATUS' | 'STATUS_ASSIGNEE' | 'CATEGORY'; enabled: boolean }
    ? true extends FieldProperty['enabled']
      ? FieldMap[FieldProperty['type']]['get']
      : never
    : FieldMap[FieldProperty['type']]['get']
  : never;

type BuildFieldForSet<FieldProperty> = FieldProperty extends { type: AnyFieldType }
  ? FieldMap[FieldProperty['type']]['set']
  : never;

type BuildFieldOnCreatePage<FieldProperty> = FieldProperty extends { type: CreatePageFieldType }
  ? FieldMap[FieldProperty['type']]['get']
  : never;
