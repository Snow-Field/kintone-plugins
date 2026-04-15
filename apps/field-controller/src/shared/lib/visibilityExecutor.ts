import { getKintoneApp } from '@kintone-plugin/kintone-utils';
import { type VisibilityRule } from '../config';
import { evaluateBlock, type KintoneEvent } from './ruleEvaluator';

export function executeVisibility(rules: VisibilityRule[], event: KintoneEvent) {
  const kintoneApp = getKintoneApp();
  rules.forEach((rule) => {
    if (!rule.enabled) return;

    if (evaluateBlock(rule.block, event)) {
      rule.targetFields.forEach((fCode) => {
        kintoneApp.record.setFieldShown(fCode, false);
      });
    }
  });
}
