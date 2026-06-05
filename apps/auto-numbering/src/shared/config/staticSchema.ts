import { z } from 'zod';
import { DATE_SOURCE, DATE_FORMATS, CONNECTORS, RESET_TIMING } from '../constant/numbering';

/** プラグインバージョン */
export const LATEST_PLUGIN_VERSION = 1;

// =============================================================================
// Version 1 Schema Definitions
// =============================================================================

// -----------------------------------------------------------------------------
// 採番システム型定義
// -----------------------------------------------------------------------------

/** 日付ソース */
export const DateSourceSchema = z.enum(Object.values(DATE_SOURCE));

/** 日付フォーマット */
export const DateFormatsSchema = z.enum(Object.values(DATE_FORMATS));

/** 連結文字 */
export const ConnectorsSchema = z.enum(Object.values(CONNECTORS));

/** リセットタイミング */
export const ResetTimingSchema = z.enum(Object.values(RESET_TIMING));

/** フォーマット部品: テキスト */
export const FormatTextSchema = z.object({
  type: z.literal('text'),
  value: z.string().optional(),
});

/** フォーマット部品: フィールド */
export const FormatFieldSchema = z.object({
  type: z.literal('field'),
  fieldCode: z.string().optional(),
});

/** フォーマット部品: 日付 */
export const FormatDateSchema = z.object({
  type: z.literal('date'),
  source: DateSourceSchema.optional(),
  format: DateFormatsSchema.optional(),
});

/** フォーマット部品（Union型） */
export const FormatPartSchema = z.discriminatedUnion('type', [
  FormatTextSchema,
  FormatFieldSchema,
  FormatDateSchema,
]);

/** 連番設定 */
export const SerialConfigSchema = z.object({
  initialValue: z.number().int().min(1),
  digit: z.number().int().min(1),
  /** 連番の位置（フォーマットパーツがある場合のみ必要） */
  position: z.enum(['prefix', 'suffix']).optional(),
  resetTiming: ResetTimingSchema,
  /** resetTiming が 'none' の場合のみ必要。連番を保存するフィールドコード */
  serialFieldCode: z.string().optional(),
});

/** 採番設定 */
export const NumberingSettingsSchema = z.object({
  /** 一意識別子（nanoid） */
  id: z.string(),
  /** 表示名（オプション） */
  label: z.string().optional(),
  /** 有効/無効フラグ */
  enabled: z.boolean(),
  /** 結果を格納するフィールドコード */
  resultFieldCode: z.string().min(1, '採番結果フィールドを選択してください'),
  /** 採番形式（0個以上、最大3個） */
  formatParts: z.array(FormatPartSchema).max(3, 'フォーマットパーツは最大3つまでです'),
  connector: ConnectorsSchema,
  /** 連番設定 */
  serialConfig: SerialConfigSchema,
});

// -----------------------------------------------------------------------------
// プラグイン設定スキーマ（V1）
// -----------------------------------------------------------------------------

export const PluginConfigSchemaV1 = z.object({
  version: z.literal(LATEST_PLUGIN_VERSION),
  /** 採番設定（複数設定可能、最大5件） */
  numberingSettings: z
    .array(NumberingSettingsSchema)
    .min(1, '採番設定を1つ以上追加してください')
    .max(5, '採番設定は最大5件までです'),
  /** APIトークン（共通） */
  common: z.object({
    apiToken: z.string().optional(),
  }),
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

/** 採番設定型 */
export type NumberingSetting = PluginConfig['numberingSettings'][number];

/** 連番設定型 */
export type SerialConfig = NumberingSetting['serialConfig'];

/** フォーマット部品型 */
export type FormatPart = z.infer<typeof FormatPartSchema>;
export type FormatText = z.infer<typeof FormatTextSchema>;
export type FormatField = z.infer<typeof FormatFieldSchema>;
export type FormatDate = z.infer<typeof FormatDateSchema>;
