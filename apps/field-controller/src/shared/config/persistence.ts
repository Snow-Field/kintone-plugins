import { nanoid } from 'nanoid';
import { definePluginConfig } from '@kintone-plugin/kintone-utils';
import { createConfigSchema } from './dynamicSchema';
import {
  type Condition,
  LATEST_PLUGIN_VERSION,
  OPERATOR_TYPES,
  type DisableRule,
  type PluginConfig,
  PluginConfigSchema,
  type VisibilityRule,
} from './staticSchema';

/** 新しい条件の既定値 */
export const createDefaultCondition = (): Condition => ({
  field: '',
  operator: OPERATOR_TYPES.EQUALS,
  value: '',
});

/**
 * 新しいルールの既定値
 * 非表示と編集不可でトリガーの種類が違うため、どちらにも入るよう、トリガーは空にする
 */
export const createDefaultRule = (enabled = true): VisibilityRule & DisableRule => ({
  id: nanoid(),
  enabled,
  block: {
    conditions: [],
    logic: 'AND',
    triggers: [],
  },
  targetFields: [],
});

/** 既定の設定 */
export const createConfig = (): PluginConfig => ({
  version: LATEST_PLUGIN_VERSION,
  visibilityRules: [createDefaultRule(false)],
  disableRules: [createDefaultRule(false)],
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
  name: 'フィールド制御プラグイン',
  schema: PluginConfigSchema,
  createDefault: createConfig,
  migrate: migrateConfig,
  createValidationSchema: createConfigSchema,
});

/** 実行画面用。読み込みに失敗したら既定値で動く（エラーはコンソールに出す） */
export const restoreConfig = (): PluginConfig => pluginConfig.restore();
