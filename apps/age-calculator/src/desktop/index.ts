import { onRecordEvents, PluginLogger } from '@kintone-plugin/kintone-utils';
import { restoreConfig } from '@/shared/config';
import { disableAgeFields, updateAges } from '@/shared/handlers/record';

const logger = new PluginLogger('Desktop');

onRecordEvents(
  ['app.record.index.edit.show', 'app.record.create.show', 'app.record.edit.show'],
  (event) => disableAgeFields(event, restoreConfig(), logger)
);

onRecordEvents(
  ['app.record.index.edit.submit', 'app.record.create.submit', 'app.record.edit.submit'],
  (event) => updateAges(event, restoreConfig(), logger)
);
