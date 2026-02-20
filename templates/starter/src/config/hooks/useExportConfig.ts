import { useExportConfig as useGenericExportConfig } from '@kintone-plugin/kintone-utils';
import { type PluginConfig } from '@/shared/config';

/** プラグイン設定情報をエクスポートするカスタムフック */
export const useExportConfig = () => {
  return useGenericExportConfig<PluginConfig>({
    pluginName: 'プラグイン',
  });
};
