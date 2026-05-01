/**
 * 採番システム エントリーポイント
 */

import { NUMBERING_SETTINGS } from './config/settings';
import { executeNumbering } from './core/numberingEngine';

// イベントハンドラー登録
kintone.events.on(['app.record.create.show', 'app.record.edit.show'], (event) => {
  const { resultFieldCode } = NUMBERING_SETTINGS;
  const record = event.record;

  // 採番フィールド編集不可
  record[resultFieldCode].disabled = true;

  // 値クリア
  if (event.type === 'app.record.create.show') {
    record[resultFieldCode].value = '';
  }

  return event;
});

kintone.events.on(
  ['app.record.create.submit.success', 'app.record.edit.submit.success'],
  async (event) => {
    await executeNumbering(event, NUMBERING_SETTINGS);
    return event;
  }
);

// 型とユーティリティのエクスポート（必要に応じて）
export * from './types/kintone';
export * from './types/numbering';
export * from './config/settings';
export { executeNumbering } from './core/numberingEngine';
