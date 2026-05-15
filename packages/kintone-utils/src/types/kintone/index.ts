/**
 * Kintone 型定義エクスポート
 * @module kintone
 */

// フィールド型
export * as Field from './field';
export type { FieldMap, AnyFieldType, FieldProperty, WithFieldProperty } from './field';

// レコード型
export type {
  KintoneRecord,
  KintoneRecordForSet,
  KintoneRecordOnCreatePage,
  BuildRecord,
  BuildRecordForSet,
  BuildRecordOnCreatePage,
  ChangedField,
  ChangedSubtable,
  ChangedRow,
  Subtable,
  SubtableOnCreatePage,
  SubtableForSet,
} from './record';

// ユーティリティ型
export type {
  RemoveNeverProperties,
  InSubtableFieldType,
  ChangeEventSupportedFieldType,
  CreatePageFieldType,
} from './utils';
