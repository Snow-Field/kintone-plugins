import { onRecordEvents } from '@kintone-plugin/kintone-utils';
import { restoreConfig } from '@/shared/config';
import { lockResultFields, numberRecord } from '@/shared/handlers/record';

onRecordEvents(
  ['app.record.create.show', 'app.record.edit.show', 'app.record.index.edit.show'],
  (event) => lockResultFields(event, restoreConfig())
);

onRecordEvents(
  [
    'app.record.create.submit.success',
    'app.record.edit.submit.success',
    'app.record.index.edit.submit.success',
  ],
  (event) => numberRecord(event, restoreConfig())
);
