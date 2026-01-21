import { PluginLogger } from '@kintone-plugin/kintone-utils';

const logger = new PluginLogger('Desktop');

(function () {
  'use strict';

  kintone.events.on('app.record.index.show', (event) => {
    logger.info('Hello kintone! Plugin is active.');
    return event;
  });
})();
