import { type DisableRule } from '../config';
import { evaluateRuleBlocks, type Event } from './ruleEvaluator';

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
