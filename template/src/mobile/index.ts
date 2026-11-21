import { PluginLogger } from '@kintone-plugin/kintone-utils';
import { restoreConfig } from '@/shared/config';

const logger = new PluginLogger('Mobile');

kintone.events.on('mobile.app.record.index.show', (event) => {
  logger.info('Hello kintone mobile! Plugin is active.');
  const pluginConfig = restoreConfig();
  console.log(pluginConfig);
  return event;
});
