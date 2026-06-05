/**
 * Kintone型定義
 */

import type { KintoneRecord as UtilsKintoneRecord } from '@kintone-plugin/kintone-utils';

export type KintoneRecord = UtilsKintoneRecord;

export type KintoneEvent =
  | kintone.events.AppRecordIndexEditShowEvent
  | kintone.events.AppRecordDetailShowEvent
  | kintone.events.AppRecordCreateShowEvent
  | kintone.events.AppRecordEditShowEvent
  | kintone.events.MobileAppRecordDetailShowEvent
  | kintone.events.MobileAppRecordCreateShowEvent
  | kintone.events.MobileAppRecordEditShowEvent;
