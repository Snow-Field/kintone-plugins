import { onRecordEvents } from '@kintone-plugin/kintone-utils';
import { restoreConfig } from '@/shared/config';
import { applyFieldControls } from '@/shared/handlers/record';

onRecordEvents(
  [
    'app.record.index.edit.show',
    'app.record.detail.show',
    'app.record.create.show',
    'app.record.edit.show',
  ],
  (event) => applyFieldControls(event, restoreConfig())
);
