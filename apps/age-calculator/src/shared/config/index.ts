import { nanoid } from 'nanoid';
import {
  LATEST_PLUGIN_VERSION,
  PluginConfigSchema,
  type PluginConfig,
  type PluginCondition,
  type AnyPluginConfig,
} from './schema';
import { PLUGIN_ID, storePluginConfig, restorePluginConfig } from '@kintone-plugin/kintone-utils';

export * from './schema';

/**
 * 初期化: デフォルトの設定値を取得
 */
export const getNewCondition = (): PluginCondition => ({
  id: nanoid(),
  srcFieldCode: '',
  destFieldCode: '',
  unit: '',
});

/**
 * 初期化: デフォルトの設定情報を返す
 */
export const createConfig = (): PluginConfig => ({
  version: LATEST_PLUGIN_VERSION,
  conditions: [getNewCondition()],
  advanced: {
    isUpdateOnSave: false,
  },
});

/**
 * 保存: 設定情報をJSON文字列に変換してkintoneに保存
 */
export const storeConfig = (config: PluginConfig, callback?: () => void): void => {
  storePluginConfig(config, callback);
};

/**
 * 変換: 古い設定情報を新しい設定情報に変換
 * 段階的なマイグレーションを行うことで、将来的なバージョンアップにも対応可能な設計にします。
 */
const migrateConfig = (parsedConfig: Record<string, any>): PluginConfig => {
  let config = { ...parsedConfig };

  // 初期状態（undefined）の処理
  if (config.version === undefined) {
    if (!config.conditions) {
      return createConfig(); // デフォルト値を返却
    }
    config.version = 1;
  }

  // 段階的なマイグレーション処理
  // Version 1 -> Version 2
  if (config.version === 1) {
    config = {
      ...config,
      version: 2,
      conditions: (config.conditions || []).map((condition: any) => ({
        ...condition,
        unit: condition.unit ?? '', // 新しく追加された unit を補完
      })),
    };
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
