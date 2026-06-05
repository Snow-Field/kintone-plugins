/**
 * Kintone型定義
 */

import type { KintoneRecord as UtilsKintoneRecord } from '@kintone-plugin/kintone-utils';

export type KintoneRecord = UtilsKintoneRecord;

export type KintoneEvent =
  | kintone.events.AppRecordIndexEditShowEvent
  | kintone.events.AppRecordCreateShowEvent
  | kintone.events.AppRecordEditShowEvent
  | kintone.events.AppRecordIndexEditSubmitEvent
  | kintone.events.AppRecordCreateSubmitEvent
  | kintone.events.AppRecordEditSubmitEvent
  | kintone.events.MobileAppRecordCreateShowEvent
  | kintone.events.MobileAppRecordEditShowEvent
  | kintone.events.MobileAppRecordCreateSubmitEvent
  | kintone.events.MobileAppRecordEditSubmitEvent;
