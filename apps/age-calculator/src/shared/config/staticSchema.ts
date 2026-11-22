import { z } from 'zod';

// =============================================================================
// Version 1
// =============================================================================

export const PluginConfigSchemaV1 = z.object({
  version: z.literal(1),
  conditions: z.array(
    z.object({
      /** 行ごとに一意の ID（並べ替えに使う） */
      id: z.string(),
      /** 生年月日のフィールドコード */
      srcFieldCode: z.string(),
      /** 年齢を書き込むフィールドコード */
      destFieldCode: z.string(),
    })
  ),
  advanced: z.object({
    /** レコードの保存時に、年齢が入っていても計算し直す */
    isUpdateOnSave: z.boolean(),
  }),
});

// =============================================================================
// Version 2: 年齢の単位（unit）を追加
// =============================================================================

export const PluginConfigSchemaV2 = PluginConfigSchemaV1.extend({
  version: z.literal(2),
  conditions: z.array(
    PluginConfigSchemaV1.shape.conditions.element.extend({
      /** 年齢の後に付ける単位（「歳」など）。文字列（1行）のフィールドにだけ付ける */
      unit: z.string(),
    })
  ),
});

// =============================================================================
// Latest
// =============================================================================

export const LATEST_PLUGIN_VERSION = 2;
export const PluginConfigSchema = PluginConfigSchemaV2;

export type PluginConfig = z.infer<typeof PluginConfigSchema>;
export type PluginCondition = PluginConfig['conditions'][number];
