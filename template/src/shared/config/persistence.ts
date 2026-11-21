import { definePluginConfig } from '@kintone-plugin/kintone-utils';
import { createConfigSchema } from '@/shared/config/dynamicSchema';
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
  message: 'Hello kintone!',
});

/**
 * 変換: 古い設定情報を新しい設定情報に変換
 */
const migrateConfig = (parsedConfig: AnyPluginConfig): PluginConfig => {
  const config = { ...parsedConfig };

  // バージョン情報がない、または認識できない構造の場合はデフォルト値で初期化
  if (config.version === undefined) {
    return createConfig();
  }

  // 将来のバージョンアップ時はここにマイグレーションステップを追加
  // if (config.version === 1) {
  //   config.version = 2;
  //   // ... V1 → V2 のマイグレーション処理
  // }

  return config as PluginConfig;
};

/**
 * プラグイン設定の定義
 * 設定画面（config）と実行画面（desktop・mobile）の両方から使う
 */
export const pluginConfig = definePluginConfig<PluginConfig>({
  name: 'プラグイン',
  schema: PluginConfigSchema,
  createDefault: createConfig,
  migrate: migrateConfig,
  createValidationSchema: createConfigSchema,
});

/**
 * 復元: 実行画面用。読み込みに失敗したら既定値で動く（エラーはコンソールに出す）
 */
export const restoreConfig = (): PluginConfig => pluginConfig.restore();
