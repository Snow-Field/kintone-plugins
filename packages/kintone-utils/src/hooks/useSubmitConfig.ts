import { useCallback } from 'react';
import { type SnackbarKey, useSnackbar } from 'notistack';
import { PluginLogger } from '../lib/logger';
import { SaveTimeoutError, waitForSave } from '../lib/pluginConfig';

const logger = new PluginLogger('Config');

type UseSubmitConfigProps<T> = {
  /** ローディング状態を制御する関数 */
  setLoading: (loading: boolean) => void;
  /**
   * kintoneへの保存処理を行う関数。完了を待つため、保存に成功したら必ず callback を呼ぶこと。
   * 非同期に失敗しうるときは Promise を返し、失敗を reject で知らせる
   */
  onSave: (data: T, callback: () => void) => void | Promise<void>;
  /** グローバル状態（Jotai等）と同期する関数 */
  onSync: (data: T) => void;
  /** 保存成功時の追加処理（Snackbarのアクション等） */
  successAction?: React.ReactNode;
  /** 保存と画面の更新の両方に成功したときのコールバック */
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
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();

  const onSubmit = useCallback(
    async (data: T) => {
      setLoading(true);
      logger.group('kintone Plugin Config Save');
      logger.log('Saving Data:', data);

      try {
        // kintoneへ保存し、完了を待つ（完了前に保存済みとして扱うと、失敗に気づけないため）
        // 完了が遅れたら、待っていることを知らせる。その間も保存中のまま操作できないようにする
        // （遅れて完了したときに、その間の操作を保存した内容で上書きしないため）
        let slowNotice: SnackbarKey | undefined;
        try {
          await waitForSave(onSave, data, {
            onSlow: () => {
              logger.warn('Save completion has not been confirmed yet. Still waiting.');
              slowNotice = enqueueSnackbar('保存の完了を待っています。このままお待ちください。', {
                variant: 'info',
                persist: true,
              });
            },
          });
        } catch (e) {
          logger.error('Save Process Failed:', e);
          // 時間切れは、保存できたかどうかが分からない。失敗と言い切らない
          enqueueSnackbar(
            e instanceof SaveTimeoutError
              ? '保存の完了を確認できませんでした。ページを再読み込みして、設定が保存されたか確かめてください。'
              : '保存に失敗しました。',
            { variant: 'error' }
          );
          onError?.();
          return;
        } finally {
          if (slowNotice !== undefined) closeSnackbar(slowNotice);
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
          // 画面が保存した内容と食い違っている可能性があるので、成功としては扱わない
          logger.error('Sync after save failed:', e);
          enqueueSnackbar(
            '設定情報は保存しましたが、画面の更新に失敗しました。ページを再読み込みしてください。',
            { variant: 'warning' }
          );
          return;
        }
        onSuccess?.();
      } finally {
        logger.groupEnd();
        setLoading(false);
      }
    },
    [setLoading, onSave, onSync, successAction, onSuccess, onError, enqueueSnackbar, closeSnackbar]
  );

  return { onSubmit };
};
