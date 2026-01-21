import { z } from 'zod';

/** 最新バージョン */
export const LATEST_PLUGIN_VERSION = 1;

/** 基本スキーマ */
export const PluginConfigSchema = z.object({
  version: z.literal(LATEST_PLUGIN_VERSION),
  message: z.string(),
});

/** 型定義 */
export type AnyPluginConfig = { version?: number } & Record<string, any>;
export type PluginConfig = z.infer<typeof PluginConfigSchema>;

/**
 * 動的な検証を含むスキーマを生成する
 * @param fieldCodes アプリに存在するフィールドコードのリスト
 */
export const createConfigSchema = (fieldCodes: string[]) => {
  const fieldCodeSet = new Set(fieldCodes);
  return PluginConfigSchema.superRefine(({ _ }, ctx) => {
    ctx.addIssue({
      code: 'custom',
      message: '指定されたフィールドがアプリ内に見つかりません',
      path: ['conditions'],
    });
  });
};
