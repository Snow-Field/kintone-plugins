import type { z, ZodType } from 'zod';
import type { FieldType } from '@kintone-plugin/kintone-utils';
import {
  PluginConfigSchema,
  type PluginConfig,
  type RuleBlock,
} from '@/shared/config/staticSchema';

/**
 * フィールド情報の型定義
 */
type FieldInfo = {
  code: string;
  type: FieldType;
};

/**
 * 演算子とフィールドタイプの互換性マップ
 *
 * - equals/notEquals: すべてのフィールドタイプで使用可能
 * - greaterThan/lessThan: 数値・日付・時刻フィールドで使用可能
 * - includes: 文字列フィールドで使用可能（配列型は対象外）
 */
const OPERATOR_FIELD_TYPE_COMPATIBILITY: Record<
  'equals' | 'notEquals' | 'greaterThan' | 'lessThan' | 'includes',
  FieldType[]
> = {
  equals: [], // 空配列 = すべてのフィールドで使用可能
  notEquals: [], // 空配列 = すべてのフィールドで使用可能
  greaterThan: ['NUMBER', 'CALC', 'DATE', 'TIME', 'DATETIME'],
  lessThan: ['NUMBER', 'CALC', 'DATE', 'TIME', 'DATETIME'],
  includes: [
    'SINGLE_LINE_TEXT',
    'MULTI_LINE_TEXT',
    'RICH_TEXT',
    'LINK',
    'RADIO_BUTTON',
    'DROP_DOWN',
    'STATUS',
  ],
};

/**
 * 演算子とフィールドタイプの互換性をチェック
 */
function isOperatorCompatibleWithFieldType(operator: string, fieldType: FieldType): boolean {
  const compatibleTypes =
    OPERATOR_FIELD_TYPE_COMPATIBILITY[operator as keyof typeof OPERATOR_FIELD_TYPE_COMPATIBILITY];

  // 空配列の場合はすべてのフィールドタイプで使用可能
  if (!compatibleTypes || compatibleTypes.length === 0) {
    return true;
  }

  return compatibleTypes.includes(fieldType);
}

/**
 * 値が数値形式かチェック
 */
function isNumericValue(value: string): boolean {
  if (value.trim() === '') return false;
  return !isNaN(Number(value));
}

/**
 * 値が日付形式（YYYY-MM-DD）かチェック
 */
function isDateFormat(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

/**
 * 値が時刻形式（HH:mm）かチェック
 */
function isTimeFormat(value: string): boolean {
  return /^\d{2}:\d{2}$/.test(value);
}

/**
 * 値が日時形式（ISO 8601）かチェック
 */
function isDateTimeFormat(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[+-]\d{2}:\d{2}$/.test(value);
}

/**
 * フィールドタイプに応じて値のフォーマットをチェック
 */
function validateValueFormat(
  fieldType: FieldType,
  value: string,
  ctx: z.RefinementCtx,
  path: Array<string | number>
): void {
  switch (fieldType) {
    case 'NUMBER':
    case 'CALC':
      if (!isNumericValue(value)) {
        ctx.addIssue({
          code: 'custom',
          path: [...path, 'value'],
          message: `数値フィールドには数値を入力してください（入力値：${value}）`,
        });
      }
      break;

    case 'DATE':
      if (!isDateFormat(value)) {
        ctx.addIssue({
          code: 'custom',
          path: [...path, 'value'],
          message: `日付フィールドにはYYYY-MM-DD形式で入力してください（入力値：${value}）`,
        });
      }
      break;

    case 'TIME':
      if (!isTimeFormat(value)) {
        ctx.addIssue({
          code: 'custom',
          path: [...path, 'value'],
          message: `時刻フィールドにはHH:mm形式で入力してください（入力値：${value}）`,
        });
      }
      break;

    case 'DATETIME':
      if (!isDateTimeFormat(value)) {
        ctx.addIssue({
          code: 'custom',
          path: [...path, 'value'],
          message: `日時フィールドにはISO 8601形式で入力してください（入力値：${value}）`,
        });
      }
      break;

    default:
      // その他のフィールドタイプは文字列として扱うため、特にチェック不要
      break;
  }
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

    // 3. 値のフォーマットチェック
    if (condition.value) {
      validateValueFormat(fieldInfo.type, condition.value, ctx, conditionPath);
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
