import { restoreConfig } from '@/shared/config';
import { executeNumbering } from '@/shared/feature/numbering';

kintone.events.on(['mobile.app.record.create.show', 'mobile.app.record.edit.show'], (event) => {
  const record = event.record;
  const pluginConfig = restoreConfig();

  pluginConfig.numberingSettings.forEach(({ resultFieldCode }) => {
    const resultField = record[resultFieldCode];
    if (resultField) {
      // 採番フィールド編集不可
      resultField.disabled = true;

      // 値クリア
      if (event.type === 'mobile.app.record.create.show') {
        resultField.value = '';
      }
    }
  });

  return event;
});

kintone.events.on(
  ['mobile.app.record.create.submit.success', 'mobile.app.record.edit.submit.success'],
  async (event) => {
    const pluginConfig = restoreConfig();
    for (const numberingSetting of pluginConfig.numberingSettings) {
      await executeNumbering(event, numberingSetting, pluginConfig.common.apiToken);
    }
    return event;
  }
);
