import { useSyncPluginConfig as useBaseSyncPluginConfig } from '@kintone-plugin/kintone-utils';
import { pluginConfigAtom } from '@/config/states/plugin';
import { type PluginConfig } from '@/shared/config';

/**
 * プラグインの状態 (Jotai & React Hook Form) を同期的に更新するためのベースフック
 */
export const useSyncPluginConfig = () => {
  return useBaseSyncPluginConfig<PluginConfig>(pluginConfigAtom);
};
