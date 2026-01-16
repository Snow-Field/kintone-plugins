import { useSetAtom } from 'jotai';
import { usePluginSubmit as useGenericPluginSubmit } from '@kintone-plugin/kintone-utils';
import { storeConfig, type PluginConfig } from '@/shared/config';
import { loadingAtom } from '@/config/states/plugin';
import { useSyncPluginConfig } from './use-sync-plugin-config';

type UsePluginSubmitProps = {
  onSuccess?: () => void;
  onError?: () => void;
  successAction?: React.ReactNode;
};

export const usePluginSubmit = (props: UsePluginSubmitProps) => {
  const setLoading = useSetAtom(loadingAtom);
  const { syncConfig } = useSyncPluginConfig();

  return useGenericPluginSubmit<PluginConfig>({
    ...props,
    setLoading,
    onSave: storeConfig,
    onSync: syncConfig,
  });
};
