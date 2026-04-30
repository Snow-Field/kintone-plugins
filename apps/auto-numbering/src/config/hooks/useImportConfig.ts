import { useImportConfig as useGenericImportConfig } from '@kintone-plugin/kintone-utils';
import { type PluginConfig, PluginConfigSchema } from '@/shared/config';
import { useSyncConfig } from './useSyncConfig';

/** プラグイン設定情報をインポートするカスタムフック */
export const useImportConfig = () => {
  const { syncConfig } = useSyncConfig();

  return useGenericImportConfig<PluginConfig>({
    schema: PluginConfigSchema,
    onSync: syncConfig,
  });
};
