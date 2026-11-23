import type { ZodType } from 'zod';
import type { FieldInfo } from '@kintone-plugin/kintone-utils';
import { type PluginCondition, type PluginConfig, PluginConfigSchema } from './staticSchema';

/** アプリにあるかを確かめる項目 */
const FIELD_CODE_KEYS = ['srcFieldCode', 'destFieldCode'] as const satisfies ReadonlyArray<
  keyof PluginCondition
>;

/**
 * アプリのフィールドに依存する検証を含むスキーマを作る
 * @param fields アプリに存在するフィールドの一覧
 */
export const createConfigSchema = (fields: FieldInfo[]): ZodType<PluginConfig, PluginConfig> => {
  const fieldCodes = new Set(fields.map((f) => f.code));
  return PluginConfigSchema.superRefine(({ conditions }, ctx) => {
    conditions.forEach((condition, index) => {
      for (const key of FIELD_CODE_KEYS) {
        const fieldCode = condition[key];
        if (fieldCode && !fieldCodes.has(fieldCode)) {
          ctx.addIssue({
            code: 'custom',
            message: `指定されたフィールドがアプリ内に見つかりません（フィールドコード: ${fieldCode}）`,
            path: ['conditions', index, key],
          });
        }
      }
    });
  });
};
