import { useEffect } from 'react';

/**
 * 未保存の変更がある場合に、ブラウザのタブを閉じたりリロードしたりするのを防ぐフック
 * @param isDirty フォームに変更があるかどうか
 */
export const useUnsavedChanges = (isDirty: boolean) => {
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (isDirty) {
        // 標準的なブラウザでの警告表示
        event.preventDefault();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isDirty]);
};
