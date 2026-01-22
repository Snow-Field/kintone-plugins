import { getApp } from '@kintone-plugin/kintone-utils';
import { type VisibilityRule } from '../config';
import { evaluateBlock, type Event } from './ruleEvaluator';

export function executeVisibility(rules: VisibilityRule[], event: Event) {
  rules.forEach((rule) => {
    if (!rule.enabled) return;

    if (evaluateBlock(rule.block, event)) {
      rule.targetFields.forEach((field) => {
        getApp().record.setFieldShown(field, false);
      });
    }
  });
}
