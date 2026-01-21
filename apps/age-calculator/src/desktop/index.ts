import { restoreConfig } from '@/shared/config';
import { calculateAge } from '@/shared/lib/calculateAge';
import { PluginLogger } from '@kintone-plugin/kintone-utils';

const logger = new PluginLogger('Desktop');

/**
 * レコード画面表示時
 */
kintone.events.on(
  ['app.record.index.edit.show', 'app.record.create.show', 'app.record.edit.show'],
  (event) => {
    const { record } = event;
    const pluginConfig = restoreConfig();

    // デバッグ用ログ（開発者ツールのConsoleで確認）
    logger.group('レコード画面表示');
    logger.log('設定情報:', pluginConfig);
    logger.log('レコード:', record);
    logger.groupEnd();

    pluginConfig.conditions.forEach(({ srcFieldCode, destFieldCode }) => {
      const srcField = record[srcFieldCode];
      const destField = record[destFieldCode];
      const isInvalid = !srcFieldCode || !destFieldCode || !srcField || !destField;
      if (isInvalid) return;
      destField.disabled = true;
    });
    return event;
  }
);

/**
 * レコード保存時
 */
kintone.events.on(
  ['app.record.index.edit.submit', 'app.record.create.submit', 'app.record.edit.submit'],
  (event) => {
    const { record } = event;

    const pluginConfig = restoreConfig();
    const isUpdateOnSave = pluginConfig.advanced.isUpdateOnSave;

    // デバッグ用ログ（開発者ツールのConsoleで確認）
    logger.group('レコード保存');
    logger.log('設定情報:', pluginConfig);
    logger.log('isUpdateOnSave:', isUpdateOnSave);
    logger.log('レコード (保存前):', JSON.parse(JSON.stringify(record)));

    pluginConfig.conditions.forEach(({ srcFieldCode, destFieldCode, unit }, index) => {
      const srcField = record[srcFieldCode];
      const destField = record[destFieldCode];
      const isInvalid = !srcField || !destField;

      logger.log(`条件[${index}]:`, {
        srcFieldCode,
        destFieldCode,
        isInvalid,
        willUpdate: !isInvalid && (!destField.value || isUpdateOnSave),
      });

      if (isInvalid) return;
      if (destField.value && !isUpdateOnSave) return;

      const age = calculateAge(srcField.value);
      logger.log(`条件[${index}] 計算結果:`, { 入力: srcField.value, 年齢: age });

      // 単位(unit)が設定されており、出力先が文字列一行フィールドの場合は単位を付与する
      if (unit && destField.type === 'SINGLE_LINE_TEXT') {
        destField.value = `${age}${unit}`;
      } else {
        destField.value = age;
      }
    });

    logger.log('レコード (保存後):', record);
    logger.groupEnd();

    return event;
  }
);
