import { useSetAtom } from 'jotai';
import { useSubmitConfig as useGenericSubmitConfig } from '@kintone-plugin/kintone-utils';
import { storeConfig, type PluginConfig } from '@/shared/config';
import { loadingAtom } from '@/config/states/plugin';
import { useSyncConfig } from './useSyncConfig';

type UseSubmitConfigProps = {
  onSuccess?: () => void;
  onError?: () => void;
  successAction?: React.ReactNode;
};

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
