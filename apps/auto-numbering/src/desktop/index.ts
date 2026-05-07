import { PluginLogger } from '@kintone-plugin/kintone-utils';
import { restoreConfig } from '@/shared/config';

const logger = new PluginLogger('Desktop');

kintone.events.on(['app.record.create.show', 'app.record.edit.show'], (event) => {
  logger.info('Hello kintone! Plugin is active.');

  const record = event.record;
  const pluginConfig = restoreConfig();

  pluginConfig.numberingSettings.forEach(({ resultFieldCode }) => {
    // 採番フィールド編集不可
    record[resultFieldCode].disabled = true;

    // 値クリア
    if (event.type === 'app.record.create.show') {
      record[resultFieldCode].value = '';
    }
  });

  return event;
});
