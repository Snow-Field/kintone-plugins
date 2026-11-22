import { onRecordEvents } from '@kintone-plugin/kintone-utils';
import { restoreConfig } from '@/shared/config';
import { lockResultFields, numberRecord } from '@/shared/handlers/record';

onRecordEvents(['mobile.app.record.create.show', 'mobile.app.record.edit.show'], (event) =>
  lockResultFields(event, restoreConfig())
);

onRecordEvents(
  ['mobile.app.record.create.submit.success', 'mobile.app.record.edit.submit.success'],
  (event) => numberRecord(event, restoreConfig())
);
