import { PluginLogger } from '@kintone-plugin/kintone-utils';

const logger = new PluginLogger('Mobile');

(function () {
  'use strict';

  kintone.events.on('mobile.app.record.index.show', (event) => {
    logger.info('Hello kintone mobile! Plugin is active.');
    return event;
  });
})();
