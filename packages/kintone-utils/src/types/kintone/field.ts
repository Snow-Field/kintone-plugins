/**
 * Kintone フィールド型定義
 * @module kintone/field
 */

/**
 * フィールドの共通プロパティ
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
 * フィールド値の型マップ
 * @see https://cybozu.dev/ja/kintone/docs/overview/field-types/
 */
export type FieldMap = {
  // ==========================================================================
  // システムフィールド
  // ==========================================================================

  __ID__: {
    get: {
      type: '__ID__';
      value: string;
    };
    set: {
      type: '__ID__';
    };
  };

  __REVISION__: {
    get: {
      type: '__REVISION__';
      value: string;
    };
    set: {
      type: '__REVISION__';
    };
  };

  RECORD_NUMBER: {
    get: { type: 'RECORD_NUMBER'; value: string };
    set: { type: 'RECORD_NUMBER' };
  };

  CREATED_TIME: {
    get: { type: 'CREATED_TIME'; value: string };
    set: { type: 'CREATED_TIME' };
  };

  UPDATED_TIME: {
    get: { type: 'UPDATED_TIME'; value: string };
    set: { type: 'UPDATED_TIME' };
  };

  CREATOR: {
    get: { type: 'CREATOR'; value: { code: string; name: string } };
    set: { type: 'CREATOR' };
  };

  MODIFIER: {
    get: { type: 'MODIFIER'; value: { code: string; name: string } };
    set: { type: 'MODIFIER' };
  };

  CATEGORY: {
    get: { type: 'CATEGORY'; value: string[] } & FieldProperty;
    set: { type: 'CATEGORY'; value: string[] };
  };

  STATUS: {
    get: { type: 'STATUS'; value: string };
    set: { type: 'STATUS' };
  };

  STATUS_ASSIGNEE: {
    get: { type: 'STATUS_ASSIGNEE'; value: Array<{ code: string; name: string }> };
    set: { type: 'STATUS_ASSIGNEE' };
  };

  // ==========================================================================
  // テキスト系フィールド
  // ==========================================================================

  SINGLE_LINE_TEXT: {
    get: { type: 'SINGLE_LINE_TEXT'; value: string | undefined } & FieldProperty;
    set: { type: 'SINGLE_LINE_TEXT'; value: string | undefined };
  };

  LINK: {
    get: { type: 'LINK'; value: string | undefined } & FieldProperty;
    set: { type: 'LINK'; value: string | undefined };
  };

  MULTI_LINE_TEXT: {
    get: { type: 'MULTI_LINE_TEXT'; value: string | undefined } & FieldProperty;
    set: { type: 'MULTI_LINE_TEXT'; value: string | undefined };
  };

  RICH_TEXT: {
    get: { type: 'RICH_TEXT'; value: string } & FieldProperty;
    set: { type: 'RICH_TEXT'; value: string };
  };

  // ==========================================================================
  // 数値・計算フィールド
  // ==========================================================================

  NUMBER: {
    get: { type: 'NUMBER'; value: string | undefined } & FieldProperty;
    set: { type: 'NUMBER'; value: string | undefined };
  };

  CALC: {
    get: { type: 'CALC'; value: string };
    set: { type: 'CALC' };
  };

  // ==========================================================================
  // 日時フィールド
  // ==========================================================================

  DATE: {
    get: { type: 'DATE'; value: string | null | undefined } & FieldProperty;
    set: { type: 'DATE'; value: string | null | undefined };
  };

  TIME: {
    get: { type: 'TIME'; value: string | null | undefined } & FieldProperty;
    set: { type: 'TIME'; value: string | null | undefined };
  };

  DATETIME: {
    get: { type: 'DATETIME'; value: string | undefined } & FieldProperty;
    set: { type: 'DATETIME'; value: string | undefined };
  };

  // ==========================================================================
  // 選択フィールド
  // ==========================================================================

  RADIO_BUTTON: {
    get: { type: 'RADIO_BUTTON'; value: string } & FieldProperty;
    set: { type: 'RADIO_BUTTON'; value: string };
  };

  DROP_DOWN: {
    get: { type: 'DROP_DOWN'; value: string | undefined } & FieldProperty;
    set: { type: 'DROP_DOWN'; value: string | undefined };
  };

  CHECK_BOX: {
    get: { type: 'CHECK_BOX'; value: string[] } & FieldProperty;
    set: { type: 'CHECK_BOX'; value: string[] };
  };

  MULTI_SELECT: {
    get: { type: 'MULTI_SELECT'; value: string[] } & FieldProperty;
    set: { type: 'MULTI_SELECT'; value: string[] };
  };

  // ==========================================================================
  // ユーザー・組織選択フィールド
  // ==========================================================================

  USER_SELECT: {
    get: { type: 'USER_SELECT'; value: Array<{ code: string; name: string }> } & FieldProperty;
    set: { type: 'USER_SELECT'; value: Array<{ code: string }> };
  };

  GROUP_SELECT: {
    get: { type: 'GROUP_SELECT'; value: Array<{ code: string; name: string }> } & FieldProperty;
    set: { type: 'GROUP_SELECT'; value: Array<{ code: string }> };
  };

  ORGANIZATION_SELECT: {
    get: {
      type: 'ORGANIZATION_SELECT';
      value: Array<{ code: string; name: string }>;
    } & FieldProperty;
    set: { type: 'ORGANIZATION_SELECT'; value: Array<{ code: string }> };
  };

  // ==========================================================================
  // その他のフィールド
  // ==========================================================================

  FILE: {
    get: {
      type: 'FILE';
      value: Array<{
        contentType: string;
        fileKey: string;
        name: string;
        size: string;
      }>;
    } & FieldProperty;
    set: { type: 'FILE' };
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
