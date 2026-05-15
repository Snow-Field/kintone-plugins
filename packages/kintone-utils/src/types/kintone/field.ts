/**
 * Kintone フィールド型定義
 * @module kintone/field
 */

/**
 * フィールドの共通プロパティ
 *
 * @remarks
 * disabled / error プロパティは一部のフィールドタイプでのみサポートされます。
 * 型システムにより、非対応フィールドでは使用できないように制限されています。
 *
 * @see https://cybozu.dev/ja/kintone/docs/js-api/events/event-object-actions/
 */
export interface FieldProperty {
  /**
   * フィールドの編集可否
   * true: 編集不可、false: 編集可
   */
  disabled?: boolean;
  /**
   * フィールドのエラーメッセージ
   */
  error?: string;
}

/**
 * FieldProperty を適用するヘルパー型
 *
 * @template T - ベースとなるフィールド型
 * @template FieldType - フィールドタイプ文字列
 */
export type WithFieldProperty<T> = T & FieldProperty;

/**
 * フィールド値の型マップ
 * @see https://cybozu.dev/ja/kintone/docs/overview/field-types/
 */
export type FieldMap = {
  // ==========================================================================
  // システムフィールド
  // ==========================================================================

  __ID__: {
    get: WithFieldProperty<{ type: '__ID__'; value: string }>;
    set: WithFieldProperty<{ type: '__ID__' }>;
  };

  __REVISION__: {
    get: WithFieldProperty<{ type: '__REVISION__'; value: string }>;
    set: WithFieldProperty<{ type: '__REVISION__' }>;
  };

  RECORD_NUMBER: {
    get: WithFieldProperty<{ type: 'RECORD_NUMBER'; value: string }>;
    set: WithFieldProperty<{ type: 'RECORD_NUMBER' }>;
  };

  CREATED_TIME: {
    get: WithFieldProperty<{ type: 'CREATED_TIME'; value: string }>;
    set: WithFieldProperty<{ type: 'CREATED_TIME' }>;
  };

  UPDATED_TIME: {
    get: WithFieldProperty<{ type: 'UPDATED_TIME'; value: string }>;
    set: WithFieldProperty<{ type: 'UPDATED_TIME' }>;
  };

  CREATOR: {
    get: WithFieldProperty<{ type: 'CREATOR'; value: { code: string; name: string } }>;
    set: WithFieldProperty<{ type: 'CREATOR' }>;
  };

  MODIFIER: {
    get: WithFieldProperty<{ type: 'MODIFIER'; value: { code: string; name: string } }>;
    set: WithFieldProperty<{ type: 'MODIFIER' }>;
  };

  CATEGORY: {
    get: WithFieldProperty<{ type: 'CATEGORY'; value: string[] }>;
    set: WithFieldProperty<{ type: 'CATEGORY'; value: string[] }>;
  };

  STATUS: {
    get: WithFieldProperty<{ type: 'STATUS'; value: string }>;
    set: WithFieldProperty<{ type: 'STATUS' }>;
  };

  STATUS_ASSIGNEE: {
    get: WithFieldProperty<{
      type: 'STATUS_ASSIGNEE';
      value: Array<{ code: string; name: string }>;
    }>;
    set: WithFieldProperty<{ type: 'STATUS_ASSIGNEE' }>;
  };

  // ==========================================================================
  // テキスト系フィールド
  // ==========================================================================

  SINGLE_LINE_TEXT: {
    get: WithFieldProperty<{ type: 'SINGLE_LINE_TEXT'; value: string | undefined }>;
    set: WithFieldProperty<{ type: 'SINGLE_LINE_TEXT'; value: string | undefined }>;
  };

  LINK: {
    get: WithFieldProperty<{ type: 'LINK'; value: string | undefined }>;
    set: WithFieldProperty<{ type: 'LINK'; value: string | undefined }>;
  };

  MULTI_LINE_TEXT: {
    get: WithFieldProperty<{ type: 'MULTI_LINE_TEXT'; value: string | undefined }>;
    set: WithFieldProperty<{ type: 'MULTI_LINE_TEXT'; value: string | undefined }>;
  };

  RICH_TEXT: {
    get: WithFieldProperty<{ type: 'RICH_TEXT'; value: string }>;
    set: WithFieldProperty<{ type: 'RICH_TEXT'; value: string }>;
  };

  // ==========================================================================
  // 数値・計算フィールド
  // ==========================================================================

  NUMBER: {
    get: WithFieldProperty<{ type: 'NUMBER'; value: string | undefined }>;
    set: WithFieldProperty<{ type: 'NUMBER'; value: string | undefined }>;
  };

  CALC: {
    get: WithFieldProperty<{ type: 'CALC'; value: string }>;
    set: WithFieldProperty<{ type: 'CALC' }>;
  };

  // ==========================================================================
  // 日時フィールド
  // ==========================================================================

  DATE: {
    get: WithFieldProperty<{ type: 'DATE'; value: string | null | undefined }>;
    set: WithFieldProperty<{ type: 'DATE'; value: string | null | undefined }>;
  };

  TIME: {
    get: WithFieldProperty<{ type: 'TIME'; value: string | null | undefined }>;
    set: WithFieldProperty<{ type: 'TIME'; value: string | null | undefined }>;
  };

  DATETIME: {
    get: WithFieldProperty<{ type: 'DATETIME'; value: string | undefined }>;
    set: WithFieldProperty<{ type: 'DATETIME'; value: string | undefined }>;
  };

  // ==========================================================================
  // 選択フィールド
  // ==========================================================================

  RADIO_BUTTON: {
    get: WithFieldProperty<{ type: 'RADIO_BUTTON'; value: string }>;
    set: WithFieldProperty<{ type: 'RADIO_BUTTON'; value: string }>;
  };

  DROP_DOWN: {
    get: WithFieldProperty<{ type: 'DROP_DOWN'; value: string | undefined }>;
    set: WithFieldProperty<{ type: 'DROP_DOWN'; value: string | undefined }>;
  };

  CHECK_BOX: {
    get: WithFieldProperty<{ type: 'CHECK_BOX'; value: string[] }>;
    set: WithFieldProperty<{ type: 'CHECK_BOX'; value: string[] }>;
  };

  MULTI_SELECT: {
    get: WithFieldProperty<{ type: 'MULTI_SELECT'; value: string[] }>;
    set: WithFieldProperty<{ type: 'MULTI_SELECT'; value: string[] }>;
  };

  // ==========================================================================
  // ユーザー・組織選択フィールド
  // ==========================================================================

  USER_SELECT: {
    get: WithFieldProperty<{ type: 'USER_SELECT'; value: Array<{ code: string; name: string }> }>;
    set: WithFieldProperty<{ type: 'USER_SELECT'; value: Array<{ code: string }> }>;
  };

  GROUP_SELECT: {
    get: WithFieldProperty<{ type: 'GROUP_SELECT'; value: Array<{ code: string; name: string }> }>;
    set: WithFieldProperty<{ type: 'GROUP_SELECT'; value: Array<{ code: string }> }>;
  };

  ORGANIZATION_SELECT: {
    get: WithFieldProperty<{
      type: 'ORGANIZATION_SELECT';
      value: Array<{ code: string; name: string }>;
    }>;
    set: WithFieldProperty<{ type: 'ORGANIZATION_SELECT'; value: Array<{ code: string }> }>;
  };

  // ==========================================================================
  // その他のフィールド
  // ==========================================================================

  FILE: {
    get: WithFieldProperty<{
      type: 'FILE';
      value: Array<{
        contentType: string;
        fileKey: string;
        name: string;
        size: string;
      }>;
    }>;
    set: WithFieldProperty<{ type: 'FILE' }>;
  };

  // ==========================================================================
  // 注意: SUBTABLE は FieldMap に含まれません
  // サブテーブルの型定義は record.ts の Subtable<T> 型を使用してください
  // ==========================================================================
};

/**
 * すべてのフィールドタイプ
 */
export type AnyFieldType = keyof FieldMap;
