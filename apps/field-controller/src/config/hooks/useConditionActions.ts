import { OPERATOR_TYPES } from '@/shared/config/staticSchema';

/** 新しい条件のデフォルト値を生成 */
export function createDefaultCondition() {
  return {
    field: '',
    operator: OPERATOR_TYPES.EQUALS,
    value: '',
  };
}
