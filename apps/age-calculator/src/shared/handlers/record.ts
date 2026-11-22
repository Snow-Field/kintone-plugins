import type { EventRecord, PluginLogger, RecordEvent } from '@kintone-plugin/kintone-utils';
import type { PluginCondition, PluginConfig } from '@/shared/config';
import { resolveAgeValue } from '@/shared/lib/resolveAgeValue';

/**
 * 条件のフィールドを、プラグインが扱える種類のときだけ取り出す
 * 設定の後にフィールドが消されたり種類が変えられたりしていたら undefined
 */
const findFields = (record: EventRecord, { srcFieldCode, destFieldCode }: PluginCondition) => {
  const birthday = record[srcFieldCode];
  const age = record[destFieldCode];
  if (birthday?.type !== 'DATE') return undefined;
  if (age?.type !== 'SINGLE_LINE_TEXT' && age?.type !== 'NUMBER') return undefined;
  return { birthday, age };
};

/**
 * レコードの表示時: 年齢のフィールドを編集できないようにする（保存時に計算して書き込むため）
 */
export const disableAgeFields = <T extends RecordEvent>(
  event: T,
  config: PluginConfig,
  logger: PluginLogger
): T => {
  logger.group('レコード画面表示');
  logger.log('設定情報:', config);

  for (const condition of config.conditions) {
    const fields = findFields(event.record, condition);
    if (fields) fields.age.disabled = true;
  }

  logger.groupEnd();
  return event;
};

/**
 * レコードの保存時: 生年月日から年齢を計算して書き込む
 */
export const updateAges = <T extends RecordEvent>(
  event: T,
  config: PluginConfig,
  logger: PluginLogger
): T => {
  const { isUpdateOnSave } = config.advanced;
  logger.group('レコード保存');
  logger.log('設定情報:', config);

  config.conditions.forEach((condition, index) => {
    const fields = findFields(event.record, condition);
    if (!fields) return;
    const { birthday, age } = fields;

    const value = resolveAgeValue({
      birthday: birthday.value ?? '',
      currentAge: age.value ?? '',
      ageFieldType: age.type,
      unit: condition.unit,
      isUpdateOnSave,
    });
    logger.log(`条件[${index}]:`, { ...condition, 書き込む値: value });
    if (value !== undefined) age.value = value;
  });

  logger.groupEnd();
  return event;
};
