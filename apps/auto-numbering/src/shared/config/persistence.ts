import { nanoid } from 'nanoid';
import { definePluginConfig, type PluginSecrets } from '@kintone-plugin/kintone-utils';
import {
  API_TOKEN_HEADER,
  apiTokenEntries,
  apiTokenKeys,
  apiTokenReadKey,
} from '@/shared/api/request';
import { CONNECTORS, RESET_TIMING } from './constants';
import { createConfigSchema } from './dynamicSchema';
import {
  LATEST_PLUGIN_VERSION,
  type NumberingSetting,
  type PluginConfig,
  PluginConfigSchema,
  PluginConfigSchemaV1,
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
    useApiToken: false,
  },
});

/**
 * 旧版の設定を最新版に変換する
 * 版（version）の無い設定は、v1 より前のものなので既定値にする。
 * v1 は API トークンを setConfig に平文で持っていた。フォームの欄に引き継ぎ、設定画面で保存したときに
 * プロキシ設定へ移す（それまでの実行画面は、プロキシ設定に何も無いのでセッションで呼ぶ）
 */
export const migrateConfig = (parsed: Record<string, unknown>): PluginConfig => {
  if (parsed.version === undefined) return createConfig();
  if (parsed.version === 1) {
    const v1 = PluginConfigSchemaV1.parse(parsed);
    return {
      ...v1,
      version: 2,
      common: { apiToken: v1.common.apiToken ?? '', useApiToken: false },
    };
  }
  return PluginConfigSchema.parse(parsed);
};

/** 前後の空白を除いたトークン（貼り付けたときに空白や改行が混ざりやすいため） */
const tokenOf = (config: PluginConfig) => config.common.apiToken.trim();

/**
 * API トークンはプロキシ設定に保存する
 * 保存先は、採番で使う REST API の URL だけ（`apiTokenEntries`）
 */
export const apiTokenSecrets: PluginSecrets<PluginConfig> = {
  toEntries: (config) => {
    const token = tokenOf(config);
    return token ? apiTokenEntries(token) : [];
  },
  strip: (config) => ({
    ...config,
    common: { apiToken: '', useApiToken: tokenOf(config) !== '' },
  }),
  /**
   * useApiToken に関係なく、保存済みのトークンを読む。インポートしたファイル（秘密を含まない）や
   * トークンの無いアプリのファイルで、保存済みのトークンを消さないため。
   * 保存済みのものが無ければ、設定の値（v1 から引き継いだトークン）を残す
   */
  fill: (config, read) => {
    const saved = read(apiTokenReadKey())?.headers[API_TOKEN_HEADER];
    return saved === undefined
      ? config
      : { ...config, common: { ...config.common, apiToken: saved } };
  },
  // トークンを空にして保存したら、前回の保存が途中で失敗していても、3つとも {} で上書きする
  knownKeys: apiTokenKeys,
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
  secrets: apiTokenSecrets,
});

/** 実行画面用。読み込みに失敗したら既定値で動く（エラーはコンソールに出す） */
export const restoreConfig = (): PluginConfig => pluginConfig.restore();
