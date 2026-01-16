import { useCallback } from 'react';
import { useFormContext } from 'react-hook-form';
import { useSnackbar } from 'notistack';

type UseExportConfigProps<T> = {
  /** 完了時のメッセージ（任意） */
  message?: string;
};

export const useExportConfig = <T extends Record<string, unknown>>({
  message = '設定情報をエクスポートしました',
}: UseExportConfigProps<T>) => {
  const { getValues } = useFormContext<T>();
  const { enqueueSnackbar } = useSnackbar();

  const exportConfig = useCallback(() => {
    const config = getValues();
    const jsonString = JSON.stringify(config, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `plugin-config-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    enqueueSnackbar(message, { variant: 'success' });
  }, [getValues, message, enqueueSnackbar]);

  return exportConfig;
};
