import type { z } from 'zod';
import type { FieldInfo } from '../hooks/usePluginForm';
import { logger } from './logger';

/**
 * 保存: 設定情報をJSON文字列に変換してkintoneに保存
 */
export const storePluginConfig = <T extends Record<string, any>>(
  config: T,
  callback?: () => void
): void => {
  const rawConfig = Object.fromEntries(
    Object.entries(config).map(([key, value]) => [key, JSON.stringify(value)])
  );
  kintone.plugin.app.setConfig(rawConfig, callback);
};

type LoadPluginConfigParams<T> = {
  schema: z.ZodType<T>;
  pluginId: string;
  defaultConfig: T;
  migrate?: (parsed: Record<string, unknown>) => T;
};

/**
 * 読み込みの結果
 * 成功したときは error が null。失敗したときは config に既定値が入り、error に原因が入る
 */
export type PluginConfigLoadResult<T> = { config: T; error: Error | null };

/**
 * 読み込み: kintoneから取得し、移行・Zodでの検証を行う
 * 失敗しても例外は投げず、既定値と原因を返す（扱いは呼び出し側が決める）
 */
export const loadPluginConfig = <T>({
  schema,
  pluginId,
  defaultConfig,
  migrate,
}: LoadPluginConfigParams<T>): PluginConfigLoadResult<T> => {
  try {
    const rawConfig: Record<string, string> = kintone.plugin.app.getConfig(pluginId);

    // 未保存なら既定値（失敗ではない）
    if (!Object.keys(rawConfig).length) return { config: defaultConfig, error: null };

    const parsed: Record<string, unknown> = Object.fromEntries(
      Object.entries(rawConfig).map(([k, v]) => [k, JSON.parse(v)])
    );
    const migrated = migrate ? migrate(parsed) : parsed;

    return { config: schema.parse(migrated), error: null };
  } catch (error) {
    // Error 以外（undefined など）が投げられても失敗として扱えるように包む
    const cause = error instanceof Error ? error : new Error(String(error));
    return { config: defaultConfig, error: cause };
  }
};

/**
 * 復元: 読み込みに失敗したら、エラーをコンソールに出して既定値を返す
 */
export const restorePluginConfig = <T>(params: LoadPluginConfigParams<T>): T => {
  const { config, error } = loadPluginConfig(params);
  if (error !== null) {
    logger.error('Plugin config restoration failed. Using default values.', error);
  }
  return config;
};

/**
 * プラグイン設定の定義
 * 設定画面（plugin-shell）と実行画面（desktop・mobile）の両方から使う
 */
export type PluginConfigDefinition<T> = {
  /** プラグイン名（エクスポートするファイル名に使う） */
  name: string;
  /** 最新版のスキーマ */
  schema: z.ZodType<T>;
  /** 既定の設定 */
  createDefault: () => T;
  /** 旧版の設定を最新版に変換する */
  migrate?: (parsed: Record<string, unknown>) => T;
  /** アプリのフィールドに依存する検証を含むスキーマを作る */
  createValidationSchema: (fields: FieldInfo[]) => z.ZodType<T>;
};

export type DefinedPluginConfig<T> = PluginConfigDefinition<T> & {
  /** 設定画面用: 失敗したかどうかも返す */
  load: () => PluginConfigLoadResult<T>;
  /** 実行画面用: 失敗したら既定値で動く（エラーはコンソールに出す） */
  restore: () => T;
  /** 保存 */
  store: (config: T, callback?: () => void) => void;
};

/**
 * プラグイン設定を定義する
 * プラグインのスクリプトの読み込み時（モジュールの最上位）に呼ぶこと。
 * kintone.$PLUGIN_ID は読み込み時にしか正しい値が保証されないため、ここで読んで保持する
 */
export const definePluginConfig = <T extends Record<string, any>>(
  definition: PluginConfigDefinition<T>
): DefinedPluginConfig<T> => {
  const pluginId = kintone.$PLUGIN_ID;
  const params = (): LoadPluginConfigParams<T> => ({
    schema: definition.schema,
    pluginId,
    defaultConfig: definition.createDefault(),
    migrate: definition.migrate,
  });

  return {
    ...definition,
    load: () => loadPluginConfig(params()),
    restore: () => restorePluginConfig(params()),
    store: storePluginConfig,
  };
};
