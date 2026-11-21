import { useCallback } from 'react';
import { useSnackbar } from 'notistack';
import { PluginLogger } from '../lib/logger';
import { waitForSave } from '../lib/pluginConfig';

const logger = new PluginLogger('Config');

type UseSubmitConfigProps<T> = {
  /** ローディング状態を制御する関数 */
  setLoading: (loading: boolean) => void;
  /** kintoneへの保存処理を行う関数。完了を待つため、保存に成功したら必ず callback を呼ぶこと */
  onSave: (data: T, callback: () => void) => void;
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
      setLoading(true);
      logger.group('kintone Plugin Config Save');
      logger.log('Saving Data:', data);

      try {
        // kintoneへ保存し、完了を待つ（完了前に保存済みとして扱うと、失敗に気づけないため）
        try {
          await waitForSave(onSave, data);
        } catch (e) {
          logger.error('Save Process Failed:', e);
          enqueueSnackbar('保存に失敗しました。', { variant: 'error' });
          onError?.();
          return;
        }
        logger.log('kintone.plugin.app.setConfig: Success');

        // アプリの状態を同期（保存は済んでいるので、失敗しても保存の失敗とは分けて知らせる）
        try {
          onSync(data);
          enqueueSnackbar('設定情報を保存しました。', {
            variant: 'success',
            action: successAction,
          });
          logger.info('Save Process Completed Successfully');
        } catch (e) {
          logger.error('Sync after save failed:', e);
          enqueueSnackbar(
            '設定情報は保存しましたが、画面の更新に失敗しました。ページを再読み込みしてください。',
            { variant: 'warning' }
          );
        }
        onSuccess?.();
      } finally {
        logger.groupEnd();
        setLoading(false);
      }
    },
    [setLoading, onSave, onSync, successAction, onSuccess, onError, enqueueSnackbar]
  );

  return { onSubmit };
};
