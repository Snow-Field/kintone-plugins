import { z } from 'zod';

/** プラグインバージョン */
export const LATEST_PLUGIN_VERSION = 1;

/** プロキシ設定で使えるメソッド（kintone の仕様） */
export const PROXY_METHODS = ['GET', 'POST', 'PUT', 'DELETE'] as const;

/** 本文の値の種類。setProxyConfig の data の値にオブジェクトは使えない */
export const DATA_VALUE_TYPES = ['string', 'number', 'boolean'] as const;

// =============================================================================
// Version 1 Schema Definitions
// 形だけを定める。入力の検証は dynamicSchema.ts で行う
// （保存した設定は値を空にしてあるので、値が必須という検証をここに書くと読み込めなくなるため）
// =============================================================================

/** ヘッダーの1行。value はフォームの中だけで使い、setConfig には空で保存する */
export const HeaderSchema = z.object({
  id: z.string(),
  key: z.string(),
  value: z.string(),
});

/** 本文の値の1行。value はフォームの中だけで使い、setConfig には空で保存する */
export const DataItemSchema = z.object({
  id: z.string(),
  key: z.string(),
  value: z.string(),
  type: z.enum(DATA_VALUE_TYPES),
});

/** 接続先。選んだメソッドごとに、URL の前方一致でヘッダーと本文の値が付く */
export const TargetSchema = z.object({
  id: z.string(),
  url: z.string(),
  methods: z.array(z.enum(PROXY_METHODS)),
  headers: z.array(HeaderSchema),
  data: z.array(DataItemSchema),
  memo: z.string(),
});

export const PluginConfigSchemaV1 = z.object({
  version: z.literal(1),
  targets: z.array(TargetSchema),
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

export type Target = PluginConfig['targets'][number];
export type Header = Target['headers'][number];
export type DataItem = Target['data'][number];
export type ProxyMethod = (typeof PROXY_METHODS)[number];
export type DataValueType = (typeof DATA_VALUE_TYPES)[number];
