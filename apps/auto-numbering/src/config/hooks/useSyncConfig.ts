import { useSyncConfig as useBaseSyncConfig } from '@kintone-plugin/kintone-utils';
import { pluginConfigAtom } from '@/config/states/plugin';
import { type PluginConfig } from '@/shared/config';

/**
 * プラグインの状態 (Jotai & React Hook Form) を同期的に更新するためのフック
 */
export const useSyncConfig = () => {
  return useBaseSyncConfig<PluginConfig>(pluginConfigAtom);
};
