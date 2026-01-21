import { useResetConfig as useGenericResetConfig } from '@kintone-plugin/kintone-utils';
import { createConfig, type PluginConfig } from '@/shared/config';
import { useSyncConfig } from './use-sync-config';

/** プラグイン設定情報をリセットするカスタムフック */
export const useResetConfig = () => {
  const { syncConfig } = useSyncConfig();

  return useGenericResetConfig<PluginConfig>({
    defaultConfig: createConfig(),
    onSync: syncConfig,
  });
};
