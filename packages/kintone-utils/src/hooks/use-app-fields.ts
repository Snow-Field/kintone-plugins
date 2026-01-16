import { useAtomValue } from 'jotai';
import { appFieldsAtom } from '../states/kintone';
import type { FieldType } from '../types/kintone';

/**
 * kintoneのフィールド一覧を取得するフック
 * すべてのフィールド、または指定した型でフィルタリングしたリストを返却する
 */
export const useAppFields = (filterTypes?: FieldType[]) => {
  const allFields = useAtomValue(appFieldsAtom);
  const fields = filterTypes ? allFields.filter((f) => filterTypes.includes(f.type)) : allFields;
  return { fields };
};
