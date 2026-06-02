import { type ZodType } from 'zod';
import { PluginConfigSchema, type PluginConfig } from '@/shared/config/staticSchema';

/**
 * 動的な検証を含むスキーマを生成する
 * @param fieldCodes アプリに存在するフィールドコードのリスト
 */
export const createConfigSchema = (fieldCodes: string[]): ZodType<PluginConfig> => {
  const _fieldCodeSet = new Set(fieldCodes);
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
