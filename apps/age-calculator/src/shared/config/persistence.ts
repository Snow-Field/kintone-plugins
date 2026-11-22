import { nanoid } from 'nanoid';
import { z } from 'zod';
import { definePluginConfig } from '@kintone-plugin/kintone-utils';
import { createConfigSchema } from './dynamicSchema';
import {
  LATEST_PLUGIN_VERSION,
  type PluginCondition,
  type PluginConfig,
  PluginConfigSchema,
  PluginConfigSchemaV1,
} from './staticSchema';

/** v1 の読み込み用。単位（unit）が入っていても捨てない */
const PluginConfigSchemaV1WithUnit = PluginConfigSchemaV1.extend({
  conditions: z.array(
    PluginConfigSchemaV1.shape.conditions.element.extend({ unit: z.string().optional() })
  ),
});

/** 新しい行の既定値 */
export const getNewCondition = (): PluginCondition => ({
  id: nanoid(),
  srcFieldCode: '',
  destFieldCode: '',
  unit: '',
});

/** 既定の設定 */
export const createConfig = (): PluginConfig => ({
  version: LATEST_PLUGIN_VERSION,
  conditions: [getNewCondition()],
  advanced: {
    isUpdateOnSave: false,
  },
});

/**
 * 旧版の設定を最新版に変換する
 * 版（version）を持つ前の設定は、条件（conditions）があれば v1 として扱い、無ければ既定値にする
 */
export const migrateConfig = (parsed: Record<string, unknown>): PluginConfig => {
  if (parsed.version === undefined && parsed.conditions === undefined) {
    return createConfig();
  }

  const version = parsed.version ?? 1;

  // v1 → v2: 単位（unit）を補う。版を上げずに単位を保存したものもあるので、入っていれば残す
  if (version === 1) {
    const v1 = PluginConfigSchemaV1WithUnit.parse({ ...parsed, version: 1 });
    return {
      ...v1,
      version: 2,
      conditions: v1.conditions.map((condition) => ({ ...condition, unit: condition.unit ?? '' })),
    };
  }

  return PluginConfigSchema.parse(parsed);
};

/**
 * プラグイン設定の定義
 * 設定画面（config）と実行画面（desktop・mobile）の両方から使う
 */
export const pluginConfig = definePluginConfig<PluginConfig>({
  name: '年齢計算プラグイン',
  schema: PluginConfigSchema,
  createDefault: createConfig,
  migrate: migrateConfig,
  createValidationSchema: createConfigSchema,
});

/** 実行画面用。読み込みに失敗したら既定値で動く（エラーはコンソールに出す） */
export const restoreConfig = (): PluginConfig => pluginConfig.restore();
