import { PluginLogger } from '@kintone-plugin/kintone-utils';
import { restoreConfig } from '@/shared/config';

const logger = new PluginLogger('Desktop');

kintone.events.on('app.record.index.show', (event) => {
  logger.info('Hello kintone! Plugin is active.');
  const pluginConfig = restoreConfig();
  console.log(pluginConfig);
  return event;
});
