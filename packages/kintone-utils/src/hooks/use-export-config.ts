import { useCallback } from 'react';
import { useFormContext } from 'react-hook-form';

export const useExportConfig = <T extends Record<string, unknown>>() => {
  const { getValues } = useFormContext<T>();

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
  }, [getValues]);

  return exportConfig;
};
