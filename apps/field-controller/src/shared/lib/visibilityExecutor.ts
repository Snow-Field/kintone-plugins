import { getApp } from '@kintone-plugin/kintone-utils';
import { VisibilityRule } from '../config';
import { evaluateRuleBlocks, type Event } from './ruleEvaluator';

export function executeVisibility(rules: VisibilityRule[], event: Event) {
  rules.forEach((rule) => {
    if (!rule.enabled) return;

    if (evaluateRuleBlocks(rule.blocks, event)) {
      rule.targetFields.forEach((field) => {
        getApp().record.setFieldShown(field, false);
      });
    }
  });
}
