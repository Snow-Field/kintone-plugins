import { useCallback } from 'react';
import { useSetAtom, type WritableAtom } from 'jotai';
import { useFormContext, type KeepStateOptions, type FieldValues } from 'react-hook-form';

/**
 * プラグインの状態 (Jotai & React Hook Form) を同期的に更新するためのベースフック
 * @param configAtom 設定を管理するJotai Atom
 */
export const useSyncPluginConfig = <T extends FieldValues>(configAtom: WritableAtom<T, [T], void>) => {
  const setConfig = useSetAtom(configAtom);
  const { reset } = useFormContext<T>();

  /**
   * 指定された設定データで各種状態を一括更新する
   * @param data 同期する最新の設定情報
   * @param options RHFのresetに渡すオプション
   */
  const syncConfig = useCallback(
    (data: T, options?: KeepStateOptions) => {
      // JotaiのAtomを更新
      setConfig(data);
      // RHFの内部状態をリセット
      reset(data, options);
    },
    [setConfig, reset]
  );

  return { syncConfig };
};
