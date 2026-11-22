import { onRecordEvents } from '@kintone-plugin/kintone-utils';
import { restoreConfig } from '@/shared/config';
import { applyFieldControls } from '@/shared/handlers/record';

onRecordEvents(
  ['mobile.app.record.detail.show', 'mobile.app.record.create.show', 'mobile.app.record.edit.show'],
  (event) => applyFieldControls(event, restoreConfig())
);
