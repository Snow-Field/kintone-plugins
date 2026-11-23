import { definePluginConfig, type PluginSecrets } from '@kintone-plugin/kintone-utils';
import { createConfigSchema } from '@/shared/config/dynamicSchema';
import {
  type AnyPluginConfig,
  LATEST_PLUGIN_VERSION,
  type PluginConfig,
  PluginConfigSchema,
  PluginConfigSchemaV1,
} from '@/shared/config/staticSchema';
import { nanoid } from 'nanoid';
import { disabledKey, fillTargets, stripTargets, toProxyEntries } from '@/shared/lib/targets';

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
export const migrateConfig = (parsedConfig: AnyPluginConfig): PluginConfig => {
  if (parsedConfig.version === undefined) return createConfig();
  if (parsedConfig.version === 1) {
    // v1 には有効・無効が無いので、すべて有効にする
    const v1 = PluginConfigSchemaV1.parse(parsedConfig);
    return ensureUniqueIds({
      version: 2,
      targets: v1.targets.map((t) => ({ ...t, enabled: true })),
    });
  }
  return ensureUniqueIds(PluginConfigSchema.parse(parsedConfig));
};

/**
 * 接続先の id が重なっていれば振り直す（インポートや手で直したファイルで起こりうる）
 * 無効な接続先の値を残すキーは id から作るので、重なると保存できなくなるため
 */
const ensureUniqueIds = (config: PluginConfig): PluginConfig => {
  const seen = new Set<string>();
  return {
    ...config,
    targets: config.targets.map((target) => {
      const id = seen.has(target.id) ? nanoid() : target.id;
      seen.add(id);
      return id === target.id ? target : { ...target, id };
    }),
  };
};

/**
 * ヘッダーとデータはプロキシ設定に保存する（setConfig は実行画面から誰でも読めるため）
 * 保存する組は管理者が決めるので、前回保存した組は kintone-utils が予約キーに記録して消す
 */
export const targetSecrets: PluginSecrets<PluginConfig> = {
  toEntries: (config) => toProxyEntries(config.targets),
  strip: (config) => ({ ...config, targets: stripTargets(config.targets) }),
  fill: (config, read) => ({ ...config, targets: fillTargets(config.targets, read) }),
  // 有効な接続先の「無効のときの保存先」は、保存のたびに消す（前回の保存が途中で失敗して残った値を消すため）
  knownKeys: (config) => config.targets.map((t) => disabledKey(t.id, t.url)),
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
