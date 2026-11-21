import { type ZodType } from 'zod';
import type { FieldInfo } from '@kintone-plugin/kintone-utils';
import { PluginConfigSchema, type PluginConfig } from '@/shared/config/staticSchema';

/**
 * 動的な検証を含むスキーマを生成する
 * @param fields アプリに存在するフィールドの一覧
 */
export const createConfigSchema = (fields: FieldInfo[]): ZodType<PluginConfig> => {
  const _fieldCodeSet = new Set(fields.map((f) => f.code));
  return PluginConfigSchema.superRefine((_, ctx) => {
    // テンプレート用のサンプルバリデーション
    /*
    ctx.addIssue({
      code: 'custom',
      message: '指定されたフィールドがアプリ内に見つかりません',
      path: ['conditions'],
    });
    */
  });
};
