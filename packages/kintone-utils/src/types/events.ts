/**
 * kintone のレコード画面のイベントの型
 *
 * kintone の API 全体の型は公式の `@kintone/dts-gen`、フィールドの値の型は
 * `@kintone/rest-api-client` を使う。公式の型ではイベントハンドラの引数が `any` のため、
 * ここではプラグインが使うイベントの外枠だけを定義する。
 * 方針: docs/decisions/packages.md
 */
import type { KintoneRecordField } from '@kintone/rest-api-client';

/** イベントで渡されるフィールド。表示・編集系のイベントでは編集可否とエラーを設定できる */
export type EventField = KintoneRecordField.OneOf & {
  disabled?: boolean;
  error?: string | null;
};

/** イベントで渡されるレコード。存在しないフィールドコードを引くと undefined */
export type EventRecord = Record<string, EventField | undefined>;

/** レコードの表示イベント（モバイルに一覧の編集は無い） */
export type RecordShowEventType =
  | `${'' | 'mobile.'}app.record.${'create' | 'edit' | 'detail'}.show`
  | 'app.record.index.edit.show';

/** レコードの保存イベント */
export type RecordSubmitEventType =
  | `${'' | 'mobile.'}app.record.${'create' | 'edit'}.submit`
  | 'app.record.index.edit.submit';

/** レコードの保存成功イベント */
export type RecordSubmitSuccessEventType =
  | `${'' | 'mobile.'}app.record.${'create' | 'edit'}.submit.success`
  | 'app.record.index.edit.submit.success';

export type RecordEventType =
  | RecordShowEventType
  | RecordSubmitEventType
  | RecordSubmitSuccessEventType;

/** レコード画面のイベント */
export type RecordEvent<T extends RecordEventType = RecordEventType> = {
  type: T;
  appId: number;
  /** 保存成功イベントでは必ずある。作成画面の表示・保存イベントには無い */
  recordId: T extends RecordSubmitSuccessEventType ? number : number | undefined;
  record: EventRecord;
};
