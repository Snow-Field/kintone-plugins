import { restoreConfig } from '@/shared/config';
import { executeDisable } from '@/shared/lib/disableExecutor';
import { executeVisibility } from '@/shared/lib/visibilityExecutor';
import { PluginLogger, onRecordEvents } from '@kintone-plugin/kintone-utils';

const logger = new PluginLogger('Desktop');

onRecordEvents(
  [
    'app.record.index.edit.show',
    'app.record.detail.show',
    'app.record.create.show',
    'app.record.edit.show',
  ],
  (event) => {
    logger.info('Plugin is active.');
    const pluginConfig = restoreConfig();
    executeDisable(pluginConfig.disableRules, event);
    executeVisibility(pluginConfig.visibilityRules, event);
    return event;
  }
);
