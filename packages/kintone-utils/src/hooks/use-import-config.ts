import { useCallback } from 'react';
import { type FieldValues, type KeepStateOptions } from 'react-hook-form';
import { useSnackbar } from 'notistack';

type Schema<T> = {
  safeParse: (data: unknown) => { success: true; data: T } | { success: false; error: any };
};

type UseImportConfigProps<T> = {
  /** バリデーション用スキーマ */
  schema: Schema<T>;
  /** グローバル状態と同期するための関数 */
  onSync: (data: T, options?: KeepStateOptions) => void;
  /** 完了時のメッセージ（任意） */
  message?: string;
};

/**
 * 設定ファイルのインポート処理を行うフック
 */
export const useImportConfig = <T extends FieldValues>({
  schema,
  onSync,
  message = '設定情報をインポートしました',
}: UseImportConfigProps<T>) => {
  const { enqueueSnackbar } = useSnackbar();

  return useCallback(
    (data: unknown) => {
      const result = schema.safeParse(data);

      if (!result.success) {
        enqueueSnackbar('設定ファイルの形式が正しくありません。', { variant: 'error' });
        return;
      }

      // 状態の同期更新 (Jotai & RHF)
      onSync(result.data, { keepDefaultValues: true });

      enqueueSnackbar(message, { variant: 'success' });
    },
    [schema, onSync, message, enqueueSnackbar]
  );
};
