import type { KintoneFormFieldProperty } from '@kintone/rest-api-client';
import { useAtomValue } from 'jotai';
import { appFieldsAtom } from '../states/kintone';

/** アプリのフィールドの情報 */
export type AppField = KintoneFormFieldProperty.OneOf;

/** フィールドの種類（`'SINGLE_LINE_TEXT'` など） */
export type AppFieldType = AppField['type'];

/**
 * kintoneのフィールド一覧を取得するフック
 * すべてのフィールド、または指定した型でフィルタリングしたリストを返却する
 * `as const` で書いた配列もそのまま渡せる
 */
export const useAppFields = (filterTypes?: readonly AppFieldType[]) => {
  const allFields = useAtomValue(appFieldsAtom);
  const fields = filterTypes ? allFields.filter((f) => filterTypes.includes(f.type)) : allFields;
  return { fields };
};
