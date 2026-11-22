import { getKintoneApp, type RecordEvent } from '@kintone-plugin/kintone-utils';
import type { PluginConfig } from '@/shared/config';
import { evaluateBlock } from '@/shared/lib/ruleEvaluator';

/**
 * レコードの表示時: 条件に合うルールの対象フィールドを、編集不可・非表示にする
 */
export const applyFieldControls = <T extends RecordEvent>(event: T, config: PluginConfig): T => {
  for (const rule of config.disableRules) {
    if (!rule.enabled || !evaluateBlock(rule.block, event)) continue;
    for (const code of rule.targetFields) {
      const field = event.record[code];
      if (field) field.disabled = true;
    }
  }

  // 非表示はイベントの戻り値では指定できないため、kintone の API で行う
  const app = getKintoneApp(event.type);
  for (const rule of config.visibilityRules) {
    if (!rule.enabled || !evaluateBlock(rule.block, event)) continue;
    for (const code of rule.targetFields) {
      app.record.setFieldShown(code, false);
    }
  }

  return event;
};
