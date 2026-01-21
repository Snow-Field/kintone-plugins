import { useSetAtom } from 'jotai';
import { useSubmitConfig as useGenericSubmitConfig } from '@kintone-plugin/kintone-utils';
import { storeConfig, type PluginConfig } from '@/shared/config';
import { loadingAtom } from '@/config/states/plugin';
import { useSyncConfig } from './use-sync-config';

type UseSubmitConfigProps = {
  onSuccess?: () => void;
  onError?: () => void;
  successAction?: React.ReactNode;
};

/**
 * kintoneプラグイン設定の保存処理を管理するフック
 */
export const useSubmitConfig = (props: UseSubmitConfigProps) => {
  const setLoading = useSetAtom(loadingAtom);
  const { syncConfig } = useSyncConfig();

  return useGenericSubmitConfig<PluginConfig>({
    ...props,
    setLoading,
    onSave: storeConfig,
    onSync: syncConfig,
  });
};
