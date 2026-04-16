import { useCallback } from 'react';
import { useFormContext } from 'react-hook-form';
import { type PluginConfig } from '@/shared/config';
import { OPERATOR_TYPES } from '@/shared/config/staticSchema';

type RulesPath = 'visibilityRules' | 'disableRules';

/** 新しい条件のデフォルト値を生成 */
function createDefaultCondition() {
  return {
    field: '',
    operator: OPERATOR_TYPES.EQUALS,
    value: '',
  };
}

export type UseConditionActionsReturn = {
  appendCondition: (ruleIndex: number) => void;
  removeCondition: (ruleIndex: number, condIndex: number) => void;
};

/**
 * 条件の CRUD 操作を管理するカスタムフック
 */
export const useConditionActions = (rulesPath: RulesPath): UseConditionActionsReturn => {
  const { getValues, setValue } = useFormContext<PluginConfig>();

  const appendCondition = useCallback(
    (ruleIndex: number) => {
      const rules = getValues(rulesPath);
      const conditions = rules[ruleIndex]?.block.conditions ?? [];
      setValue(
        `${rulesPath}.${ruleIndex}.block.conditions` as never,
        [...conditions, createDefaultCondition()] as never,
        { shouldDirty: true }
      );
    },
    [getValues, setValue, rulesPath]
  );

  const removeCondition = useCallback(
    (ruleIndex: number, condIndex: number) => {
      const rules = getValues(rulesPath);
      const conditions = rules[ruleIndex]?.block.conditions ?? [];
      const updated = conditions.filter((_, i) => i !== condIndex);
      setValue(`${rulesPath}.${ruleIndex}.block.conditions` as never, updated as never, {
        shouldDirty: true,
      });
    },
    [getValues, setValue, rulesPath]
  );

  return { appendCondition, removeCondition };
};
