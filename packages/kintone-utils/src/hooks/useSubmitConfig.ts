import { useCallback } from 'react';
import { useSnackbar } from 'notistack';
import { PluginLogger } from '../lib/logger';

const logger = new PluginLogger('Config');

type UseSubmitConfigProps<T> = {
  /** ローディング状態を制御する関数 */
  setLoading: (loading: boolean) => void;
  /** kintoneへの保存処理を行う関数 */
  onSave: (data: T, callback?: () => void) => void;
  /** グローバル状態（Jotai等）と同期する関数 */
  onSync: (data: T) => void;
  /** 保存成功時の追加処理（Snackbarのアクション等） */
  successAction?: React.ReactNode;
  /** 成功時のコールバック */
  onSuccess?: () => void;
  /** 失敗時のコールバック */
  onError?: () => void;
};

/**
 * kintoneプラグイン設定の保存処理を管理するフック
 */
export const useSubmitConfig = <T>({
  setLoading,
  onSave,
  onSync,
  successAction,
  onSuccess,
  onError,
}: UseSubmitConfigProps<T>) => {
  const { enqueueSnackbar } = useSnackbar();

  const onSubmit = useCallback(
    async (data: T) => {
      try {
        setLoading(true);

        logger.group('kintone Plugin Config Save');
        logger.log('Saving Data:', data);

        // kintoneへ保存
        onSave(data, () => {
          logger.log('kintone.plugin.app.setConfig: Success');
        });

        // アプリの状態を同期
        onSync(data);

        enqueueSnackbar('設定情報を保存しました。', {
          variant: 'success',
          action: successAction,
        });

        logger.info('Save Process Completed Successfully');
        onSuccess?.();
      } catch (e) {
        logger.error('Save Process Failed:', e);
        enqueueSnackbar('保存に失敗しました。', { variant: 'error' });
        onError?.();
      } finally {
        logger.groupEnd();
        setLoading(false);
      }
    },
    [setLoading, onSave, onSync, successAction, onSuccess, onError, enqueueSnackbar]
  );

  return { onSubmit };
};
