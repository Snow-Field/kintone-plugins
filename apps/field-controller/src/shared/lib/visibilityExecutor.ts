import { getKintoneApp } from '@kintone-plugin/kintone-utils';
import { type VisibilityRule } from '../config';
import { evaluateBlock, type Event } from './ruleEvaluator';

export function executeVisibility(rules: VisibilityRule[], event: Event) {
  const kintoneApp = getKintoneApp();
  rules.forEach((rule) => {
    if (!rule.enabled) return;

    if (evaluateBlock(rule.block, event)) {
      rule.targetFields.forEach((field) => {
        kintoneApp.record.setFieldShown(field, false);
      });
    }
  });
}
