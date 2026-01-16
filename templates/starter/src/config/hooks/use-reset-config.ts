import { useResetConfig as useGenericResetConfig } from '@kintone-plugin/kintone-utils';
import { createConfig, type PluginConfig } from '@/shared/config';
import { useSyncPluginConfig } from './use-sync-plugin-config';

/** プラグイン設定情報をリセットするカスタムフック */
export const useResetConfig = () => {
  const { syncConfig } = useSyncPluginConfig();

  return useGenericResetConfig<PluginConfig>({
    defaultConfig: createConfig(),
    onSync: syncConfig,
  });
};
