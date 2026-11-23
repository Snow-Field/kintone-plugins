import { definePluginConfig, type PluginSecrets } from '@kintone-plugin/kintone-utils';
import { createConfigSchema } from '@/shared/config/dynamicSchema';
import {
  type AnyPluginConfig,
  LATEST_PLUGIN_VERSION,
  type PluginConfig,
  PluginConfigSchema,
} from '@/shared/config/staticSchema';
import { fillTargets, stripTargets, toProxyEntries } from '@/shared/lib/targets';

/**
 * このプラグインの ID。呼び出す側が kintone.plugin.app.proxy に渡すので、使い方タブに出す
 * kintone.$PLUGIN_ID はスクリプトの読み込み時にしか正しい値が保証されないため、ここで読む
 */
export const PLUGIN_ID: string = kintone.$PLUGIN_ID;

/** 初期化: 接続先は0件 */
export const createConfig = (): PluginConfig => ({
  version: LATEST_PLUGIN_VERSION,
  targets: [],
});

/**
 * 変換: 古い設定情報を新しい設定情報に変換
 * 版（version）の無い設定は既定値にする
 */
const migrateConfig = (parsedConfig: AnyPluginConfig): PluginConfig => {
  if (parsedConfig.version === undefined) return createConfig();
  return PluginConfigSchema.parse(parsedConfig);
};

/**
 * ヘッダーと本文の値はプロキシ設定に保存する（setConfig は実行画面から誰でも読めるため）
 * 保存する組は管理者が決めるので、前回保存した組は kintone-utils が予約キーに記録して消す
 */
export const targetSecrets: PluginSecrets<PluginConfig> = {
  toEntries: (config) => toProxyEntries(config.targets),
  strip: (config) => ({ ...config, targets: stripTargets(config.targets) }),
  fill: (config, read) => ({ ...config, targets: fillTargets(config.targets, read) }),
};

/**
 * プラグイン設定の定義
 * 設定画面（config）だけで使う（このプラグインは実行画面の処理を持たない）
 */
export const pluginConfig = definePluginConfig<PluginConfig>({
  name: 'API プロキシ設定プラグイン',
  schema: PluginConfigSchema,
  createDefault: createConfig,
  migrate: migrateConfig,
  createValidationSchema: createConfigSchema,
  secrets: targetSecrets,
});
