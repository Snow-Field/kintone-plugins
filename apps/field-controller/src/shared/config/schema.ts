import { z } from 'zod';

/** 最新バージョン */
export const LATEST_PLUGIN_VERSION = 1;

/** *******************************************************************
 * Version 1
 ******************************************************************** */

/** トリガースキーマ */
const TriggerSchemaV1 = z.enum([
  'app.record.create.show',
  'app.record.edit.show',
  'app.record.index.show',
  'app.record.detail.show',
]);

/** 条件スキーマ */
const ConditionSchemaV1 = z.object({
  field: z.string(),
  operator: z.enum(['equals', 'not_equals', 'greater_than', 'less_than', 'in']),
  value: z.any(),
});

/** ルールブロックスキーマ */
const RuleBlockSchemaV1 = z
  .object({
    triggers: z.array(TriggerSchemaV1),
    conditions: z.array(ConditionSchemaV1),
    logic: z.enum(['AND', 'OR']).optional(),
  })
  .refine((data) => data.conditions.length === 0 || data.logic, {
    message: 'conditions がある場合は logic が必要です',
    path: ['logic'],
  });

const ActionSchemaV1 = z.object({
  hide: z.array(z.string()),
  disable: z.array(z.string()),
});

/** ルールスキーマ */
const RuleSchemaV1 = z.object({
  id: z.string(),
  enabled: z.boolean(),
  blocks: z.array(RuleBlockSchemaV1),
  action: ActionSchemaV1,
});

/** プラグイン設定スキーマ */
const PluginConfigSchemaV1 = z.object({
  version: z.literal(1),
  rules: z.array(RuleSchemaV1),
});

/** 最新スキーマ */
export const PluginConfigSchema = PluginConfigSchemaV1;

/** 型定義 */
export type AnyPluginConfig = { version?: number } & Record<string, any>;
export type PluginConfig = z.infer<typeof PluginConfigSchema>;
export type Rule = PluginConfig['rules'][number];

/**
 * 動的な検証を含むスキーマを生成する
 * @param fieldCodes アプリに存在するフィールドコードのリスト
 */
export const createConfigSchema = (fieldCodes: string[]) => {
  const fieldCodeSet = new Set(fieldCodes);
  return PluginConfigSchema.superRefine(({ rules }, ctx) => {
    rules.forEach((rule, index) => {
      // 存在チェック（設定されているコードが現在のアプリに存在するか確認）
      [].forEach((key) => {
        const fieldCode = rule[key];
        // 値が設定されており、かつアプリのフィールドコード一覧に含まれていない場合
        if (fieldCode && !fieldCodeSet.has(fieldCode)) {
          ctx.addIssue({
            code: 'custom',
            message: '指定されたフィールドがアプリ内に見つかりません',
            path: ['conditions', index, key],
          });
        }
      });
    });
  });
};
