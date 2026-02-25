import { nanoid } from 'nanoid';
import { PLUGIN_ID, storePluginConfig, restorePluginConfig } from '@kintone-plugin/kintone-utils';
import {
  LATEST_PLUGIN_VERSION,
  PluginConfigSchema,
  type PluginConfig,
  type AnyPluginConfig,
} from '@/shared/config/staticSchema';

/**
 * 初期化: デフォルトの設定情報を返す
 */
export const createConfig = (): PluginConfig => ({
  version: LATEST_PLUGIN_VERSION,
  visibilityRules: [
    {
      id: nanoid(),
      enabled: false,
      block: {
        conditions: [],
        logic: 'AND',
        triggers: [],
      },
      targetFields: [],
    },
  ],
  disableRules: [
    {
      id: nanoid(),
      enabled: false,
      block: {
        conditions: [],
        logic: 'AND',
        triggers: [],
      },
      targetFields: [],
    },
  ],
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
const migrateConfig = (parsedConfig: Record<string, any>): PluginConfig => {
  const config = { ...parsedConfig };

  // 初期状態（undefined）の処理
  if (config.version === undefined) {
    if (!config.conditions) {
      return createConfig(); // デフォルト値を返却
    }
    config.version = 1;
  }

  return config as PluginConfig;
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
