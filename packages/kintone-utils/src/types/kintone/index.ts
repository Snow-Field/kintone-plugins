/**
 * Kintone 型定義エクスポート
 * @module kintone
 * @note グローバルAPI型定義は global.d.ts 経由で自動的に読み込まれます
 */

// フィールド型
export * as Field from './field';
export type { FieldMap, AnyFieldType, FieldProperty } from './field';

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

// イベント型（既存）
export * as Event from './event';
