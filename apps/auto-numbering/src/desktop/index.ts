import { restoreConfig } from '@/shared/config';
import { executeNumbering } from '@/shared/feature/numbering';

kintone.events.on(['app.record.create.show', 'app.record.edit.show'], (event) => {
  const record = event.record;
  const pluginConfig = restoreConfig();

  pluginConfig.numberingSettings.forEach(({ resultFieldCode }) => {
    const resultField = record[resultFieldCode];
    if (resultField) {
      // 採番フィールド編集不可
      resultField.disabled = true;

      // 値クリア
      if (event.type === 'app.record.create.show') {
        resultField.value = '';
      }
    }
  });

  return event;
});

kintone.events.on(
  ['app.record.create.submit.success', 'app.record.edit.submit.success'],
  async (event) => {
    const pluginConfig = restoreConfig();
    for (const numberingSetting of pluginConfig.numberingSettings) {
      await executeNumbering(event, numberingSetting, pluginConfig.common.apiToken);
    }
    return event;
  }
);
