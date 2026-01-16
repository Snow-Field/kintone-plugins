import { useCallback } from "react";
import { useSnackbar } from "notistack";

type UseResetConfigProps<T> = {
  /** デフォルトの設定情報 */
  defaultConfig: T;
  /** グローバル状態と同期するための関数 */
  onSync: (data: T, options?: { keepDefaultValues: boolean }) => void;
  /** 完了時のメッセージ（任意） */
  message?: string;
};

/**
 * プラグイン設定のリセット処理を行うフック
 */
export const useResetConfig = <T>({
  defaultConfig,
  onSync,
  message = "設定をリセットしました",
}: UseResetConfigProps<T>) => {
  const { enqueueSnackbar } = useSnackbar();

  return useCallback(() => {
    // 状態の同期更新 (Jotai & RHF)
    // keepDefaultValues: true を指定することで、保存済み設定との差分を検知し isDirty を維持可能にする
    onSync(defaultConfig, { keepDefaultValues: true });

    enqueueSnackbar(message, { variant: "success" });
  }, [onSync, defaultConfig, message, enqueueSnackbar]);
};
