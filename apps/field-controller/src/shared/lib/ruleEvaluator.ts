import type { RuleBlock } from '../config/staticSchema';

export type Event = {
  type: string;
  record: Record<string, any>;
};

function evaluateCondition(
  condition: RuleBlock['conditions'][number],
  record: Record<string, any>
): boolean {
  const fieldValue = record[condition.field]?.value;
  const conditionValue = condition.value;

  switch (condition.operator) {
    case 'equals':
      return fieldValue === conditionValue;
    case 'notEquals':
      return fieldValue !== conditionValue;
    case 'includes':
      // 文字列フィールドの部分一致検索
      return typeof fieldValue === 'string' && typeof conditionValue === 'string'
        ? fieldValue.includes(conditionValue)
        : false;
    default:
      return false;
  }
}

export function evaluateBlock(block: RuleBlock, event: Event): boolean {
  if (block.triggers.length === 0) return false;

  if (!block.triggers.includes(event.type as any)) {
    return false;
  }

  // conditions が空 → 無条件
  if (block.conditions.length === 0) {
    return true;
  }

  const results = block.conditions.map((condition) => evaluateCondition(condition, event.record));

  return block.logic === 'AND' ? results.every(Boolean) : results.some(Boolean);
}
