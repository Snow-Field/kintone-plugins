import { LATEST_PLUGIN_VERSION, PluginConfigSchema, type PluginConfig, type AnyPluginConfig } from './schema';
import { PLUGIN_ID, storePluginConfig, restorePluginConfig } from '@kintone-plugin/kintone-utils';

export * from './schema';

/**
 * 初期化: デフォルトの設定情報を返す
 */
export const createConfig = (): PluginConfig => ({
  version: LATEST_PLUGIN_VERSION,
  message: 'Hello kintone!',
});

/**
 * 保存: 設定情報をkintoneに保存
 */
export const storeConfig = (config: PluginConfig, callback?: () => void): void => {
  storePluginConfig(config, callback);
};

/**
 * 変換: 古い設定情報を新しい設定情報に変換
 */
const migrateConfig = (anyConfig: AnyPluginConfig): PluginConfig => {
  return anyConfig as PluginConfig;
};

/**
 * 復元: kintoneから取得し、Zodで検証・補完して返す
 */
export const restoreConfig = (): PluginConfig => {
  return restorePluginConfig({
    schema: PluginConfigSchema,
    pluginId: PLUGIN_ID,
    defaultConfig: createConfig(),
    migrate: (parsed) => migrateConfig(parsed as AnyPluginConfig),
  });
};
