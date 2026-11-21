import { nanoid } from 'nanoid';
import type { VisibilityRule, DisableRule } from '@/shared/config';

/** 新しいルールのデフォルト値を生成 */
export function createDefaultRule(): VisibilityRule | DisableRule {
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
