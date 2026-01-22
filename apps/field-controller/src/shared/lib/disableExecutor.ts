import { type DisableRule } from '../config';
import { evaluateBlock, type Event } from './ruleEvaluator';

export function executeDisable(rules: DisableRule[], event: Event) {
  rules.forEach((rule) => {
    if (!rule.enabled) return;

    if (evaluateBlock(rule.block, event)) {
      rule.targetFields.forEach((field) => {
        event.record[field].disabled = true;
      });
    }
  });
}
