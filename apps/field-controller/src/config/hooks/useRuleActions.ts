import { useCallback } from 'react';
import { useFieldArray, useFormContext } from 'react-hook-form';
import { nanoid } from 'nanoid';
import { type PluginConfig, type VisibilityRule, type DisableRule } from '@/shared/config';

type RulesPath = 'visibilityRules' | 'disableRules';

/** 新しいルールのデフォルト値を生成 */
function createDefaultRule(): VisibilityRule | DisableRule {
  return {
    id: nanoid(),
    enabled: true,
    block: {
      conditions: [],
      logic: 'AND',
      triggers: [],
    },
    targetFields: [],
  };
}

export type UseRuleActionsReturn = {
  appendRule: () => void;
  removeRule: (index: number) => void;
  moveRule: (from: number, to: number) => void;
  duplicateRule: (index: number) => void;
};

/**
 * ルールの CRUD 操作を管理するカスタムフック
 */
export const useRuleActions = (rulesPath: RulesPath): UseRuleActionsReturn => {
  const { control, getValues } = useFormContext<PluginConfig>();
  const { append, remove, move, insert } = useFieldArray({ control, name: rulesPath });

  const appendRule = useCallback(() => {
    append(createDefaultRule() as never);
  }, [append]);

  const removeRule = useCallback(
    (index: number) => {
      remove(index);
    },
    [remove]
  );

  const moveRule = useCallback(
    (from: number, to: number) => {
      move(from, to);
    },
    [move]
  );

  const duplicateRule = useCallback(
    (index: number) => {
      const rules = getValues(rulesPath);
      const source = rules[index];
      if (!source) return;
      const duplicated = {
        ...source,
        id: nanoid(),
        block: {
          ...source.block,
          conditions: source.block.conditions.map((c) => ({ ...c })),
          triggers: [...source.block.triggers],
        },
        targetFields: [...source.targetFields],
      };
      insert(index + 1, duplicated as never);
    },
    [getValues, insert, rulesPath]
  );

  return { appendRule, removeRule, moveRule, duplicateRule };
};
