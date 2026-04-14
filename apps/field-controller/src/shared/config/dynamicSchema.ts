// TODO: 対象フィールドの重複チェックについて検討

import type { z, ZodType } from 'zod';
import { type KintoneFormFieldProperty } from '@kintone/rest-api-client';
import {
  PluginConfigSchema,
  OPERATOR_TYPES,
  type PluginConfig,
  type RuleBlock,
} from '@/shared/config/staticSchema';

/** フィールドプロパティの型エイリアス */
type FieldProperty = KintoneFormFieldProperty.OneOf;

/** 演算子とフィールドタイプの互換性マップ */
const OPERATOR_COMPATIBILITY: Partial<Record<FieldProperty['type'], OPERATOR_TYPES[]>> = {
  SINGLE_LINE_TEXT: [
    OPERATOR_TYPES.EQUALS,
    OPERATOR_TYPES.NOT_EQUALS,
    OPERATOR_TYPES.INCLUDES,
    OPERATOR_TYPES.NOT_INCLUDES,
  ],
  NUMBER: [
    OPERATOR_TYPES.EQUALS,
    OPERATOR_TYPES.NOT_EQUALS,
    OPERATOR_TYPES.GREATER_THAN,
    OPERATOR_TYPES.LESS_THAN,
    OPERATOR_TYPES.GREATER_THAN_OR_EQUAL,
    OPERATOR_TYPES.LESS_THAN_OR_EQUAL,
  ],
  CALC: [
    OPERATOR_TYPES.EQUALS,
    OPERATOR_TYPES.NOT_EQUALS,
    OPERATOR_TYPES.GREATER_THAN,
    OPERATOR_TYPES.LESS_THAN,
    OPERATOR_TYPES.GREATER_THAN_OR_EQUAL,
    OPERATOR_TYPES.LESS_THAN_OR_EQUAL,
  ],
  MULTI_LINE_TEXT: [OPERATOR_TYPES.INCLUDES, OPERATOR_TYPES.NOT_INCLUDES],
  CHECK_BOX: [OPERATOR_TYPES.INCLUDES, OPERATOR_TYPES.NOT_INCLUDES],
  RADIO_BUTTON: [OPERATOR_TYPES.INCLUDES, OPERATOR_TYPES.NOT_INCLUDES],
  DROP_DOWN: [OPERATOR_TYPES.INCLUDES, OPERATOR_TYPES.NOT_INCLUDES],
  MULTI_SELECT: [OPERATOR_TYPES.INCLUDES, OPERATOR_TYPES.NOT_INCLUDES],
  DATE: [
    OPERATOR_TYPES.EQUALS,
    OPERATOR_TYPES.NOT_EQUALS,
    OPERATOR_TYPES.GREATER_THAN,
    OPERATOR_TYPES.LESS_THAN,
    OPERATOR_TYPES.GREATER_THAN_OR_EQUAL,
    OPERATOR_TYPES.LESS_THAN_OR_EQUAL,
  ],
  TIME: [
    OPERATOR_TYPES.EQUALS,
    OPERATOR_TYPES.NOT_EQUALS,
    OPERATOR_TYPES.GREATER_THAN,
    OPERATOR_TYPES.LESS_THAN,
    OPERATOR_TYPES.GREATER_THAN_OR_EQUAL,
    OPERATOR_TYPES.LESS_THAN_OR_EQUAL,
  ],
  DATETIME: [
    OPERATOR_TYPES.EQUALS,
    OPERATOR_TYPES.NOT_EQUALS,
    OPERATOR_TYPES.GREATER_THAN,
    OPERATOR_TYPES.LESS_THAN,
    OPERATOR_TYPES.GREATER_THAN_OR_EQUAL,
    OPERATOR_TYPES.LESS_THAN_OR_EQUAL,
  ],
};

/** デフォルト演算子リスト */
const DEFAULT_OPERATORS: OPERATOR_TYPES[] = [OPERATOR_TYPES.INCLUDES, OPERATOR_TYPES.NOT_INCLUDES];

/**
 * 演算子がフィールドタイプと互換性があるかチェック
 * 互換性マップに存在しないフィールドタイプは includes / notIncludes のみ許可（OTHERS 扱い）
 */
export function isOperatorCompatibleWithFieldType(
  operator: OPERATOR_TYPES,
  fieldType: FieldProperty['type']
): boolean {
  const compatibleOperators = OPERATOR_COMPATIBILITY[fieldType] ?? DEFAULT_OPERATORS;
  return compatibleOperators.includes(operator);
}

/**
 * ルールブロック内の条件をバリデーション
 */
function validateBlocks(
  block: RuleBlock,
  fieldInfoMap: Map<string, FieldProperty>,
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
      return;
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
 * @param fields - kintoneアプリのフィールド情報（appFieldsAtom が返す配列）
 * @returns 動的バリデーションが追加されたZodスキーマ
 */
export function createConfigSchema(fields: FieldProperty[]): ZodType<PluginConfig> {
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
