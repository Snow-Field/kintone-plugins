/**
 * Kintone 型定義エクスポート
 * @module kintone
 */

// フィールド型
export * as Field from './field';
export type { FieldMap, AnyFieldType } from './field';

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

// グローバルAPI型定義（副作用のみ、型定義をグローバルに注入）
import './global';
import './events';
