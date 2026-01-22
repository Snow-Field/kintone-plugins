import type { z, ZodType } from 'zod';
import {
  PluginConfigSchema,
  type PluginConfig,
  type RuleBlock,
} from '@/shared/config/staticSchema';

function validateBlocks(
  block: RuleBlock,
  fieldCodeSet: Set<string>,
  ctx: z.RefinementCtx,
  basePath: Array<string | number>
) {
  block.conditions.forEach((condition, condIndex) => {
    if (!fieldCodeSet.has(condition.field)) {
      ctx.addIssue({
        code: 'custom',
        path: [...basePath, 'conditions', condIndex, 'field'],
        message: '指定されたフィールドがアプリ内に見つかりません',
      });
    }
  });
}

export function createConfigSchema(fieldCodes: string[]): ZodType<PluginConfig> {
  const fieldCodeSet = new Set(fieldCodes);

  return PluginConfigSchema.superRefine((config, ctx) => {
    config.visibilityRules.forEach((rule, ruleIndex) => {
      rule.targetFields.forEach((field, i) => {
        if (!fieldCodeSet.has(field)) {
          ctx.addIssue({
            code: 'custom',
            path: ['visibilityRules', ruleIndex, 'targetFields', i],
            message: '指定されたフィールドがアプリ内に見つかりません',
          });
        }
      });

      validateBlocks(rule.block, fieldCodeSet, ctx, ['visibilityRules', ruleIndex, 'blocks']);
    });

    config.disableRules.forEach((rule, ruleIndex) => {
      rule.targetFields.forEach((field, i) => {
        if (!fieldCodeSet.has(field)) {
          ctx.addIssue({
            code: 'custom',
            path: ['disableRules', ruleIndex, 'targetFields', i],
            message: '指定されたフィールドがアプリ内に見つかりません',
          });
        }
      });

      validateBlocks(rule.block, fieldCodeSet, ctx, ['disableRules', ruleIndex, 'block']);
    });
  });
}
