import type { RecordEvent, RecordSubmitSuccessEventType } from '@kintone-plugin/kintone-utils';

/** 採番処理を実行する保存成功イベント */
export type KintoneEvent = RecordEvent<RecordSubmitSuccessEventType>;
