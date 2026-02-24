import { z } from 'zod';

/** プラグインバージョン */
export const LATEST_PLUGIN_VERSION = 1;

/** 演算子 */
export enum OPERATOR_TYPES {
  EQUALS = 'equals',
  NOT_EQUALS = 'notEquals',
  GREATER_THAN = 'greaterThan',
  LESS_THAN = 'lessThan',
  GREATER_THAN_OR_EQUAL = 'greaterThanOrEqual',
  LESS_THAN_OR_EQUAL = 'lessThanOrEqual',
  INCLUDES = 'includes',
  NOT_INCLUDES = 'notIncludes',
}

// =============================================================================
// Version 1 Schema Definitions
// =============================================================================

/** 共通：フィールド条件設定 */
const ConditionSchemaV1 = z.object({
  field: z.string(),
  operator: z.enum(Object.values(OPERATOR_TYPES)),
  value: z.union([z.string(), z.array(z.string())]),
});

/** 共通：ルールブロックのベース構造 */
const RuleBlockBaseSchemaV1 = z.object({
  conditions: z.array(ConditionSchemaV1),
  logic: z.enum(['AND', 'OR']),
});

// -----------------------------------------------------------------------------
// 非表示制御（Visibility）関連
// -----------------------------------------------------------------------------

/** 非表示制御の対象となるイベントトリガー */
const VisibilityTriggerSchemaV1 = z.enum([
  'app.record.detail.show',
  'app.record.create.show',
  'app.record.edit.show',
  'mobile.app.record.detail.show',
  'mobile.app.record.create.show',
  'mobile.app.record.edit.show',
]);

/** 非表示制御のルールブロック */
const VisibilityRuleBlockSchemaV1 = RuleBlockBaseSchemaV1.extend({
  triggers: z.array(VisibilityTriggerSchemaV1),
});

/** 非表示制御の1ルール単位 */
const VisibilityRuleSchemaV1 = z.object({
  id: z.string(),
  block: VisibilityRuleBlockSchemaV1,
  targetFields: z.array(z.string()),
});

/** 非表示制御設定 */
const VisibilitySettingV1 = z.object({
  enabled: z.boolean(),
  rules: z.array(VisibilityRuleSchemaV1),
});

// -----------------------------------------------------------------------------
// 非活性制御（Disable）関連
// -----------------------------------------------------------------------------

/** 無効化制御の対象となるイベントトリガー */
const DisableTriggerSchemaV1 = z.enum([
  'app.record.index.edit.show',
  'app.record.create.show',
  'app.record.edit.show',
  'mobile.app.record.create.show',
  'mobile.app.record.edit.show',
]);

/** 非活性制御のルールブロック */
const DisableRuleBlockSchemaV1 = RuleBlockBaseSchemaV1.extend({
  triggers: z.array(DisableTriggerSchemaV1),
});

/** 非活性制御の1ルール単位 */
const DisableRuleSchemaV1 = z.object({
  id: z.string(),
  block: DisableRuleBlockSchemaV1,
  targetFields: z.array(z.string()),
});

/** 非活性制御設定 */
const DisableSettingV1 = z.object({
  enabled: z.boolean(),
  rules: z.array(DisableRuleSchemaV1),
});

// -----------------------------------------------------------------------------
// プラグイン設定スキーマ（V1）
// -----------------------------------------------------------------------------

export const PluginConfigSchemaV1 = z.object({
  version: z.literal(1),
  visibilitySetting: VisibilitySettingV1,
  disableSetting: DisableSettingV1,
});

// =============================================================================
// Latest Version Schema
// =============================================================================

export const PluginConfigSchema = PluginConfigSchemaV1;

// =============================================================================
// 型定義
// =============================================================================

/** 任意のバージョンの設定を許容するための型定義 */
export type AnyPluginConfig = { version?: number } & Record<string, unknown>;

/** 最新バージョンのプラグイン設定型 */
export type PluginConfig = z.infer<typeof PluginConfigSchema>;

/** 非表示制御設定の型 */
export type VisibilitySetting = PluginConfig['visibilitySetting'];

/** 非活性制御の型 */
export type DisableSetting = PluginConfig['disableSetting'];

/** 非表示制御ルールの型 */
export type VisibilityRule = VisibilitySetting['rules'][number];

/** 非活性制御ルールの型 */
export type DisableRule = DisableSetting['rules'][number];

/** 非表示制御条件ブロックの型 */
export type VisibilityRuleBlock = VisibilityRule['block'];

/** 非活性制御条件ブロックの型 */
export type DisableRuleBlock = DisableRule['block'];

/** 条件ブロックの共通型 */
export type RuleBlock = VisibilityRuleBlock | DisableRuleBlock;
