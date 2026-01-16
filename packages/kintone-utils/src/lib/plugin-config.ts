import type { z } from "zod";
import { logger } from "./logger";

/**
 * 保存: 設定情報をJSON文字列に変換してkintoneに保存
 */
export const storePluginConfig = <T extends Record<string, any>>(
  config: T,
  callback?: () => void,
): void => {
  const rawConfig = Object.fromEntries(
    Object.entries(config).map(([key, value]) => [key, JSON.stringify(value)]),
  );
  kintone.plugin.app.setConfig(rawConfig, callback);
};

/**
 * 復元: kintoneから取得し、Zodで検証・補完して返す
 */
export const restorePluginConfig = <T extends Record<string, any>>({
  schema,
  pluginId,
  defaultConfig,
  migrate,
}: {
  schema: z.ZodSchema<T>;
  pluginId: string;
  defaultConfig: T;
  migrate?: (parsed: any) => T;
}): T => {
  try {
    const rawConfig: Record<string, string> =
      kintone.plugin.app.getConfig(pluginId);

    // データが空なら初期値をパースして返す
    if (!Object.keys(rawConfig).length) return defaultConfig;

    // パース処理
    const parsed = Object.fromEntries(
      Object.entries(rawConfig).map(([k, v]) => [k, JSON.parse(v)]),
    );

    // マイグレーション
    const migrated = migrate ? migrate(parsed) : parsed;

    // スキーマ検証
    return schema.parse(migrated);
  } catch (error) {
    logger.error(
      "Plugin config restoration failed. Using default values.",
      error,
    );
    return defaultConfig;
  }
};
