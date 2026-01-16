import { z } from 'zod';

/** 最新バージョン */
export const LATEST_PLUGIN_VERSION = 1;

/** 基本スキーマ */
export const PluginConfigSchema = z.object({
  version: z.literal(LATEST_PLUGIN_VERSION).default(LATEST_PLUGIN_VERSION),
  message: z.string().default('Hello kintone!'),
});

/** 型定義 */
export type PluginConfig = z.infer<typeof PluginConfigSchema>;
export type AnyPluginConfig = { version?: number } & Record<string, any>;

/**
 * 動的な検証を含むスキーマを生成する
 * @param fieldCodes アプリに存在するフィールドコードのリスト
 */
export const createConfigSchema = (fieldCodes: string[]) => {
  // フィールドコードが必要なバリデーションがあればここに記述
  return PluginConfigSchema;
};
