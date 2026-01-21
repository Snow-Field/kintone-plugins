import { evaluateRuleBlocks, type Event } from './ruleEvaluator';
import type { DisableRule } from '../config';

export function executeDisable(rules: DisableRule[], event: Event) {
  rules.forEach((rule) => {
    if (!rule.enabled) return;

    if (evaluateRuleBlocks(rule.blocks, event)) {
      rule.targetFields.forEach((field) => {
        event.record[field].disabled = true;
      });
    }
  });
}
