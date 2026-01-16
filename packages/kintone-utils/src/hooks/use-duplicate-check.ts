import { useCallback } from 'react';
import { useFormContext, useWatch, type Path, type FieldValues } from 'react-hook-form';

/**
 * 配列内のフィールド重複チェック用フック
 * @param index 現在の行番号
 * @param arrayKey 監視対象の配列フィールド名
 */
export const useDuplicateCheck = <T extends FieldValues>(index: number, arrayKey: Path<T>) => {
  const { control } = useFormContext<T>();

  // 入力値を監視
  const items = useWatch({ control, name: arrayKey });

  const isDuplicate = useCallback(
    (value: string, key: string) => {
      if (!Array.isArray(items)) return false;
      return items.some((item: Record<string, any>, i: number) => i !== index && item[key] === value);
    },
    [items, index]
  );

  return { isDuplicate };
};
