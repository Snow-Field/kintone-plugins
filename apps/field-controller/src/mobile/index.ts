import { restoreConfig } from '@/shared/config';
import { executeDisable } from '@/shared/lib/disableExecutor';
import { executeVisibility } from '@/shared/lib/visibilityExecutor';
import { PluginLogger } from '@kintone-plugin/kintone-utils';

const logger = new PluginLogger('Mobile');

kintone.events.on(
  ['mobile.app.record.detail.show', 'mobile.app.record.create.show', 'mobile.app.record.edit.show'],
  (event) => {
    logger.info('Plugin is active.');
    const pluginConfig = restoreConfig();
    executeDisable(pluginConfig.disableRules, event);
    executeVisibility(pluginConfig.visibilityRules, event);
    return event;
  }
);
