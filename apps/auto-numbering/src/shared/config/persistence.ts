import { PLUGIN_ID, storePluginConfig, restorePluginConfig } from '@kintone-plugin/kintone-utils';
import { nanoid } from 'nanoid';
import {
  LATEST_PLUGIN_VERSION,
  PluginConfigSchema,
  type PluginConfig,
  type AnyPluginConfig,
} from '@/shared/config/staticSchema';
import { RESET_TIMING, CONNECTORS, DATE_SOURCE, DATE_FORMATS } from '@/shared/constant/numbering';

/**
 * 初期化: デフォルトの設定情報を返す
 */
export const createConfig = (): PluginConfig => ({
  version: LATEST_PLUGIN_VERSION,
  numberingSettings: [
    {
      id: nanoid(),
      label: '',
      enabled: true,
      resultFieldCode: '',
      formatParts: [
        {
          type: 'text',
          value: '',
        },
      ],
      connector: CONNECTORS.HYPHEN,
      serialConfig: {
        initialValue: 1,
        digit: 5,
        position: 'suffix',
        resetTiming: RESET_TIMING.NONE,
        serialFieldCode: '',
      },
    },
  ],
  common: {
    apiToken: '',
  },
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
const migrateConfig = (parsedConfig: AnyPluginConfig): PluginConfig => {
  const config = { ...parsedConfig };

  // バージョン情報がない、または認識できない構造の場合はデフォルト値で初期化
  if (config.version === undefined) {
    console.warn('[migrateConfig] No version found in config. Using default config.');
    return createConfig();
  }

  // 将来のバージョンアップ時はここにマイグレーションステップを追加
  // if (config.version === 1) {
  //   config.version = 2;
  //   // ... V1 → V2 のマイグレーション処理
  //   // 例: 新しいフィールドの追加、フィールド名の変更など
  // }

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
