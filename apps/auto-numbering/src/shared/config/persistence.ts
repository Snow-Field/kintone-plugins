import { nanoid } from 'nanoid';
import { definePluginConfig } from '@kintone-plugin/kintone-utils';
import { CONNECTORS, RESET_TIMING } from './constants';
import { createConfigSchema } from './dynamicSchema';
import {
  LATEST_PLUGIN_VERSION,
  type NumberingSetting,
  type PluginConfig,
  PluginConfigSchema,
} from './staticSchema';

/** 新しい採番設定の既定値 */
export const createDefaultNumberingSetting = (): NumberingSetting => ({
  id: nanoid(),
  label: '',
  enabled: true,
  resultFieldCode: '',
  formatParts: [{ type: 'text', value: '' }],
  connector: CONNECTORS.HYPHEN,
  serialConfig: {
    initialValue: 1,
    digit: 5,
    position: 'suffix',
    resetTiming: RESET_TIMING.NONE,
    serialFieldCode: '',
  },
});

/** 既定の設定。最初の採番設定は連番だけ（書式のパーツは空） */
export const createConfig = (): PluginConfig => ({
  version: LATEST_PLUGIN_VERSION,
  numberingSettings: [{ ...createDefaultNumberingSetting(), formatParts: [] }],
  common: {
    apiToken: '',
  },
});

/**
 * 旧版の設定を最新版に変換する
 * 版（version）の無い設定は、v1 より前のものなので既定値にする
 */
export const migrateConfig = (parsed: Record<string, unknown>): PluginConfig => {
  if (parsed.version === undefined) return createConfig();
  return PluginConfigSchema.parse(parsed);
};

/**
 * プラグイン設定の定義
 * 設定画面（config）と実行画面（desktop・mobile）の両方から使う
 */
export const pluginConfig = definePluginConfig<PluginConfig>({
  name: '自動採番プラグイン',
  schema: PluginConfigSchema,
  createDefault: createConfig,
  migrate: migrateConfig,
  createValidationSchema: createConfigSchema,
});

/** 実行画面用。読み込みに失敗したら既定値で動く（エラーはコンソールに出す） */
export const restoreConfig = (): PluginConfig => pluginConfig.restore();
