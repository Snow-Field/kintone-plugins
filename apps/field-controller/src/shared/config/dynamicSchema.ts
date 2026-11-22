// TODO: 対象フィールドの重複チェックについて検討

import type { z, ZodType } from 'zod';
import type { AppFieldType, FieldInfo } from '@kintone-plugin/kintone-utils';
import {
  PluginConfigSchema,
  OPERATOR_TYPES,
  type PluginConfig,
  type RuleBlock,
} from './staticSchema';

/** 演算子とフィールドタイプの互換性マップ */
const OPERATOR_COMPATIBILITY: Partial<Record<AppFieldType, OPERATOR_TYPES[]>> = {
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

/** 値が空でもよい演算子 */
const EMPTY_VALUE_OPERATORS = new Set<OPERATOR_TYPES>([
  OPERATOR_TYPES.EQUALS,
  OPERATOR_TYPES.NOT_EQUALS,
]);

/** デフォルト演算子リスト */
const DEFAULT_OPERATORS: OPERATOR_TYPES[] = [OPERATOR_TYPES.INCLUDES, OPERATOR_TYPES.NOT_INCLUDES];

/**
 * フィールドの種類で使える演算子の一覧
 * 互換性マップに存在しないフィールドタイプは includes / notIncludes のみ（OTHERS 扱い）
 */
export function getCompatibleOperators(fieldType: AppFieldType): OPERATOR_TYPES[] {
  return OPERATOR_COMPATIBILITY[fieldType] ?? DEFAULT_OPERATORS;
}

/**
 * 演算子がフィールドタイプと互換性があるかチェック
 * 互換性マップに存在しないフィールドタイプは includes / notIncludes のみ許可（OTHERS 扱い）
 */
export function isOperatorCompatibleWithFieldType(
  operator: OPERATOR_TYPES,
  fieldType: AppFieldType
): boolean {
  return getCompatibleOperators(fieldType).includes(operator);
}

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

    // 3. 値の入力チェック。等しい・等しくないは「空のとき」の条件として空を許す
    // （含むは空だと必ず合い、大小の比較は空だと必ず合わないため）
    if (!EMPTY_VALUE_OPERATORS.has(condition.operator) && condition.value.length === 0) {
      ctx.addIssue({
        code: 'custom',
        path: [...conditionPath, 'value'],
        message: '値を入力してください',
      });
    }
  });
}

/**
 * プラグイン設定の動的バリデーションスキーマを生成
 *
 * @param fields - kintoneアプリのフィールド情報（usePluginForm の FieldInfo と互換）
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
