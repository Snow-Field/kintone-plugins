import type { RecordEvent, RecordShowEventType } from '@kintone-plugin/kintone-utils';
import type { PluginConfig } from '@/shared/config';
import type { KintoneEvent } from '@/shared/types/kintone';
import { executeNumbering } from './numbering';

/** 有効な採番設定だけを返す */
const enabledSettings = (config: PluginConfig) => config.numberingSettings.filter((s) => s.enabled);

/**
 * レコードの表示時: 採番結果のフィールドを編集できないようにする（保存の後に採番するため）
 * 作成画面では、再利用やコピーで入った値を消す
 */
export const lockResultFields = <T extends RecordEvent<RecordShowEventType>>(
  event: T,
  config: PluginConfig
): T => {
  const isCreate = event.type.endsWith('app.record.create.show');
  for (const { resultFieldCode } of enabledSettings(config)) {
    const field = event.record[resultFieldCode];
    if (!field) continue;
    field.disabled = true;
    if (isCreate && field.type === 'SINGLE_LINE_TEXT') field.value = '';
  }
  return event;
};

/**
 * レコードの保存の成功時: 有効な採番設定ごとに、順番に採番する
 * （同じレコードを更新するので、並行させない）
 */
export const numberRecord = async <T extends KintoneEvent>(
  event: T,
  config: PluginConfig
): Promise<T> => {
  for (const setting of enabledSettings(config)) {
    await executeNumbering(event, setting, config.common.apiToken);
  }
  return event;
};
