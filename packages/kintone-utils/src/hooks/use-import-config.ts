import { useCallback } from 'react';
import { useFormContext, type FieldValues } from 'react-hook-form';

// Zodライクなスキーマインターフェース
type Schema<T> = {
  safeParse: (data: unknown) => { success: true; data: T } | { success: false; error: any };
};

export const useImportConfig = <T extends FieldValues>(schema: Schema<T>) => {
  const { reset } = useFormContext<T>();

  const importConfig = useCallback(
    (data: unknown) => {
      const result = schema.safeParse(data);

      if (!result.success) {
        console.error('Import validation failed:', result.error);
        alert('設定ファイルの形式が正しくありません。');
        return;
      }

      reset(result.data);
    },
    [reset, schema]
  );

  return importConfig;
};
