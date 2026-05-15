/**
 * Kintone型定義
 */

import type { KintoneRecord as UtilsKintoneRecord } from '@kintone-plugin/kintone-utils';

export type KintoneRecord = UtilsKintoneRecord;

export type KintoneEvent =
  | kintone.events.AppRecordCreateSubmitSuccessEvent
  | kintone.events.AppRecordEditSubmitSuccessEvent
  | kintone.events.AppRecordIndexEditSubmitSuccessEvent
  | kintone.events.MobileAppRecordCreateSubmitSuccessEvent
  | kintone.events.MobileAppRecordEditSubmitSuccessEvent;
