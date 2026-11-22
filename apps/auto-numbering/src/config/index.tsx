import { renderPluginConfig } from '@kintone-plugin/plugin-shell';
import { pluginConfig } from '@/shared/config';
import { tabs } from './tabs';

renderPluginConfig({ definition: pluginConfig, tabs });
