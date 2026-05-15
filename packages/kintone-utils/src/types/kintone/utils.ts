/**
 * ユーティリティ型定義
 * @module kintone/utils
 */

/**
 * オブジェクトから never 型のプロパティを除外
 */
export type RemoveNeverProperties<T> = {
  [K in keyof T as T[K] extends never ? never : K]: T[K];
};

/**
 * サブテーブル内で使用可能なフィールドタイプ
 */
export type InSubtableFieldType =
  | 'SINGLE_LINE_TEXT'
  | 'LINK'
  | 'MULTI_LINE_TEXT'
  | 'RICH_TEXT'
  | 'NUMBER'
  | 'CALC'
  | 'DATE'
  | 'TIME'
  | 'DATETIME'
  | 'RADIO_BUTTON'
  | 'DROP_DOWN'
  | 'CHECK_BOX'
  | 'MULTI_SELECT'
  | 'USER_SELECT'
  | 'GROUP_SELECT'
  | 'ORGANIZATION_SELECT'
  | 'FILE';

/**
 * 変更イベントをサポートするフィールドタイプ
 *
 * @note サブテーブルの変更は SUBTABLE フィールド全体ではなく、
 *       サブテーブル内の個別フィールドの変更として扱われます
 */
export type ChangeEventSupportedFieldType =
  | 'SINGLE_LINE_TEXT'
  | 'NUMBER'
  | 'DATE'
  | 'TIME'
  | 'DATETIME'
  | 'RADIO_BUTTON'
  | 'DROP_DOWN'
  | 'CHECK_BOX'
  | 'MULTI_SELECT'
  | 'USER_SELECT'
  | 'ORGANIZATION_SELECT'
  | 'GROUP_SELECT';

/**
 * 作成画面で使用可能なフィールドタイプ
 */
export type CreatePageFieldType =
  | 'CATEGORY'
  | 'SINGLE_LINE_TEXT'
  | 'LINK'
  | 'MULTI_LINE_TEXT'
  | 'RICH_TEXT'
  | 'NUMBER'
  | 'CALC'
  | 'DATE'
  | 'TIME'
  | 'DATETIME'
  | 'RADIO_BUTTON'
  | 'DROP_DOWN'
  | 'CHECK_BOX'
  | 'MULTI_SELECT'
  | 'USER_SELECT'
  | 'ORGANIZATION_SELECT'
  | 'GROUP_SELECT'
  | 'FILE';

/**
 * disabled/error プロパティをサポートするフィールドタイプ
 *
 * @remarks
 * 以下のフィールドタイプは disabled/error プロパティに対応していません:
 * - システムフィールド: __ID__, __REVISION__, RECORD_NUMBER, CREATOR, CREATED_TIME, MODIFIER, UPDATED_TIME
 * - ステータス関連: STATUS, STATUS_ASSIGNEE
 * - 計算フィールド: CALC
 *
 * @note 現時点では未使用
 */
export type FieldPropertySupportedType =
  | 'SINGLE_LINE_TEXT'
  | 'LINK'
  | 'MULTI_LINE_TEXT'
  | 'RICH_TEXT'
  | 'NUMBER'
  | 'DATE'
  | 'TIME'
  | 'DATETIME'
  | 'RADIO_BUTTON'
  | 'DROP_DOWN'
  | 'CHECK_BOX'
  | 'MULTI_SELECT'
  | 'USER_SELECT'
  | 'GROUP_SELECT'
  | 'ORGANIZATION_SELECT'
  | 'FILE'
  | 'CATEGORY';
