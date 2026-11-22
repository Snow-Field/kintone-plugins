import { onRecordEvents, PluginLogger } from '@kintone-plugin/kintone-utils';
import { restoreConfig } from '@/shared/config';
import { disableAgeFields, updateAges } from '@/shared/handlers/record';

const logger = new PluginLogger('Mobile');

onRecordEvents(['mobile.app.record.create.show', 'mobile.app.record.edit.show'], (event) =>
  disableAgeFields(event, restoreConfig(), logger)
);

onRecordEvents(['mobile.app.record.create.submit', 'mobile.app.record.edit.submit'], (event) =>
  updateAges(event, restoreConfig(), logger)
);
