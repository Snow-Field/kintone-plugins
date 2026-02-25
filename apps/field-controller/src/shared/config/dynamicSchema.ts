import type { z, ZodType } from 'zod';
import type { FieldProperty, FieldType } from '@kintone-plugin/kintone-utils';
import {
  PluginConfigSchema,
  type PluginConfig,
  type RuleBlock,
  type OPERATOR_TYPES,
} from '@/shared/config/staticSchema';

/**
 * ルールブロック内の条件をバリデーション
 */
function validateBlocks(
  block: RuleBlock,
  fieldInfoMap: Map<string, FieldInfo>,
  ctx: z.RefinementCtx,
  basePath: Array<string | number>
) {
  block.conditions.forEach((condition, condIndex) => {
    const conditionPath = [...basePath, 'conditions', condIndex];
    const fieldInfo = fieldInfoMap.get(condition.field);

    // 1. フィールドコードの存在チェック
    if (!fieldInfo) {
      ctx.addIssue({
        code: 'custom',
        path: [...conditionPath, 'field'],
        message: `指定されたフィールドがアプリ内に見つかりません（フィールドコード：${condition.field}）`,
      });
      return; // フィールドが存在しない場合、以降のチェックはスキップ
    }

    // 2. 演算子とフィールドタイプの互換性チェック
    if (!isOperatorCompatibleWithFieldType(condition.operator, fieldInfo.type)) {
      ctx.addIssue({
        code: 'custom',
        path: [...conditionPath, 'operator'],
        message: `演算子「${condition.operator}」はフィールドタイプ「${fieldInfo.type}」では使用できません`,
      });
    }
  });
}

/**
 * プラグイン設定の動的バリデーションスキーマを生成
 *
 * @param fields - kintoneアプリのフィールド情報
 * @returns 動的バリデーションが追加されたZodスキーマ
 */
export function createConfigSchema(fields: FieldInfo[]): ZodType<PluginConfig> {
  const fieldInfoMap = new Map(fields.map((f) => [f.code, f]));

  return PluginConfigSchema.superRefine((config, ctx) => {
    // 非表示ルールのバリデーション
    config.visibilityRules.forEach((rule, ruleIndex) => {
      rule.targetFields.forEach((field, i) => {
        if (!fieldInfoMap.has(field)) {
          ctx.addIssue({
            code: 'custom',
            path: ['visibilityRules', ruleIndex, 'targetFields', i],
            message: `指定されたフィールドがアプリ内に見つかりません（フィールドコード：${field}）`,
          });
        }
      });

      validateBlocks(rule.block, fieldInfoMap, ctx, ['visibilityRules', ruleIndex, 'block']);
    });

    // 編集不可ルールのバリデーション
    config.disableRules.forEach((rule, ruleIndex) => {
      rule.targetFields.forEach((field, i) => {
        if (!fieldInfoMap.has(field)) {
          ctx.addIssue({
            code: 'custom',
            path: ['disableRules', ruleIndex, 'targetFields', i],
            message: `指定されたフィールドがアプリ内に見つかりません（フィールドコード：${field}）`,
          });
        }
      });

      validateBlocks(rule.block, fieldInfoMap, ctx, ['disableRules', ruleIndex, 'block']);
    });
  });
}
