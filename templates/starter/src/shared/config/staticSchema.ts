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
