import { type DisableRule } from '../config';
import { evaluateBlock, type KintoneEvent } from './ruleEvaluator';

export function executeDisable(rules: DisableRule[], event: KintoneEvent) {
  rules.forEach((rule) => {
    if (!rule.enabled) return;

    if (evaluateBlock(rule.block, event)) {
      rule.targetFields.forEach((fCode) => {
        const field = event.record[fCode];
        if (field !== undefined) {
          field.disabled = true;
        }
      });
    }
  });
}
