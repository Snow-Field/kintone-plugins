import type { z } from 'zod';
import type { FieldInfo } from '../hooks/usePluginForm';
import { logger } from './logger';
import {
  type PluginSecrets,
  PROXY_KEYS_CONFIG_KEY,
  parseProxyKeys,
  readProxySettings,
  storeProxyEntries,
} from './proxyConfig';

/**
 * 保存: 設定情報をJSON文字列に変換してkintoneに保存
 */
export const storePluginConfig = <T extends Record<string, unknown>>(
  config: T,
  callback?: () => void
): void => {
  const rawConfig = Object.fromEntries(
    Object.entries(config).map(([key, value]) => [key, JSON.stringify(value)])
  );
  kintone.plugin.app.setConfig(rawConfig, callback);
};

/** 投げられた値を Error にそろえる（undefined などが投げられても失敗として扱えるように） */
const toError = (error: unknown): Error =>
  error instanceof Error ? error : new Error(String(error));

/** 保存の完了を待っていると知らせるまでの時間の既定値（ミリ秒） */
export const SAVE_SLOW_MS = 30_000;

/** 保存の完了を待つのを打ち切るまでの時間の既定値（ミリ秒） */
export const SAVE_TIMEOUT_MS = 120_000;

/** 決められた時間までに保存の完了を確認できなかった（保存できたかどうかは分からない） */
export class SaveTimeoutError extends Error {
  constructor(timeoutMs: number) {
    super(`保存の完了を ${timeoutMs / 1000} 秒以内に確認できませんでした`);
    this.name = 'SaveTimeoutError';
  }
}

type WaitForSaveOptions = {
  /** これを過ぎても完了しなければ onSlow を1回呼ぶ。そのあとも timeoutMs までは待つ */
  slowAfterMs?: number;
  onSlow?: () => void;
  /** これを過ぎても完了しなければ SaveTimeoutError で失敗にする（保存中のまま止まらないため） */
  timeoutMs?: number;
};

/**
 * 保存の完了を待つ
 * kintone.plugin.app.setConfig は成功したときだけコールバックを呼ぶため、それを待つ。
 * 同期的に投げられた例外は失敗として扱う。
 * 完了が遅れることがあるため、slowAfterMs で待っていることを知らせ、timeoutMs まで待つ
 */
export const waitForSave = <T>(
  save: (config: T, callback: () => void) => void | Promise<void>,
  config: T,
  { slowAfterMs = SAVE_SLOW_MS, onSlow, timeoutMs = SAVE_TIMEOUT_MS }: WaitForSaveOptions = {}
): Promise<void> =>
  new Promise((resolve, reject) => {
    const slowTimer = setTimeout(() => onSlow?.(), slowAfterMs);
    const timeoutTimer = setTimeout(() => reject(new SaveTimeoutError(timeoutMs)), timeoutMs);
    const clearTimers = () => {
      clearTimeout(slowTimer);
      clearTimeout(timeoutTimer);
    };
    const fail = (error: unknown) => {
      clearTimers();
      reject(toError(error));
    };
    try {
      // 非同期の保存（プロキシ設定を含むもの）は、途中の失敗を Promise で知らせる
      const pending = save(config, () => {
        clearTimers();
        resolve();
      });
      pending?.catch(fail);
    } catch (error) {
      fail(error);
    }
  });

type LoadPluginConfigParams<T> = {
  schema: z.ZodType<T>;
  pluginId: string;
  defaultConfig: T;
  migrate?: (parsed: Record<string, unknown>) => T;
};

/**
 * 読み込みの結果
 * 成功したときは error が null。失敗したときは config に既定値が入り、error に原因が入る
 */
export type PluginConfigLoadResult<T> = { config: T; error: Error | null };

/**
 * 読み込み: kintoneから取得し、移行・Zodでの検証を行う
 * 失敗しても例外は投げず、既定値と原因を返す（扱いは呼び出し側が決める）
 */
export const loadPluginConfig = <T>({
  schema,
  pluginId,
  defaultConfig,
  migrate,
}: LoadPluginConfigParams<T>): PluginConfigLoadResult<T> => {
  try {
    const rawConfig: Record<string, string> = kintone.plugin.app.getConfig(pluginId);

    // 未保存なら既定値（失敗ではない）
    if (!Object.keys(rawConfig).length) return { config: defaultConfig, error: null };

    // プロキシ設定のキー（予約キー）は設定の一部ではないので除く
    const parsed: Record<string, unknown> = Object.fromEntries(
      Object.entries(rawConfig)
        .filter(([k]) => k !== PROXY_KEYS_CONFIG_KEY)
        .map(([k, v]) => [k, JSON.parse(v)])
    );
    const migrated = migrate ? migrate(parsed) : parsed;

    return { config: schema.parse(migrated), error: null };
  } catch (error) {
    return { config: defaultConfig, error: toError(error) };
  }
};

/**
 * 復元: 読み込みに失敗したら、エラーをコンソールに出して既定値を返す
 */
export const restorePluginConfig = <T>(params: LoadPluginConfigParams<T>): T => {
  const { config, error } = loadPluginConfig(params);
  if (error !== null) {
    logger.error('Plugin config restoration failed. Using default values.', error);
  }
  return config;
};

/**
 * プラグイン設定の定義
 * 設定画面（plugin-shell）と実行画面（desktop・mobile）の両方から使う
 */
export type PluginConfigDefinition<T> = {
  /** プラグイン名（エクスポートするファイル名に使う） */
  name: string;
  /** 最新版のスキーマ */
  schema: z.ZodType<T>;
  /** 既定の設定 */
  createDefault: () => T;
  /** 旧版の設定を最新版に変換する */
  migrate?: (parsed: Record<string, unknown>) => T;
  /** アプリのフィールドに依存する検証を含むスキーマを作る */
  createValidationSchema: (fields: FieldInfo[]) => z.ZodType<T, T>;
  /** 秘密（API トークンなど）をプロキシ設定に分けて保存するときに渡す */
  secrets?: PluginSecrets<T>;
};

/** 設定ファイルなどを検証した結果 */
export type PluginConfigParseResult<T> =
  | { success: true; data: T }
  | { success: false; error: Error };

export type DefinedPluginConfig<T> = PluginConfigDefinition<T> & {
  /** 設定画面用: 失敗したかどうかも返す。secrets があれば、保存済みの秘密も読む */
  load: () => PluginConfigLoadResult<T>;
  /**
   * インポート用: 旧版からの移行を通してから検証する。
   * version が数値で入っていないものは拒否する（移行処理が version の無い設定を既定値に戻すため、
   * 無関係なファイルが既定値として受け付けられてしまう）。
   * secrets があれば、保存済みの秘密のうち合うものを埋める（エクスポートには秘密が入らないため）
   */
  parse: (data: unknown) => PluginConfigParseResult<T>;
  /** 実行画面用: 失敗したら既定値で動く（エラーはコンソールに出す）。秘密は読まない */
  restore: () => T;
  /**
   * 保存。secrets があれば、先にプロキシ設定を保存し、消えた組を {} で上書きしてから setConfig に保存する。
   * そのときは Promise を返し、途中の失敗は reject で知らせる
   */
  store: (config: T, callback: () => void) => void | Promise<void>;
  /** エクスポートする形（secrets があれば秘密を除く） */
  toExport: (config: T) => T;
};

/**
 * プラグイン設定を定義する
 * プラグインのスクリプトの読み込み時（モジュールの最上位）に呼ぶこと。
 * kintone.$PLUGIN_ID は読み込み時にしか正しい値が保証されないため、ここで読んで保持する
 */
export const definePluginConfig = <T extends { version: number } & Record<string, unknown>>(
  definition: PluginConfigDefinition<T>
): DefinedPluginConfig<T> => {
  const pluginId = kintone.$PLUGIN_ID;
  const params = (): LoadPluginConfigParams<T> => ({
    schema: definition.schema,
    pluginId,
    defaultConfig: definition.createDefault(),
    migrate: definition.migrate,
  });

  const { secrets } = definition;

  /** 保存済みの秘密を埋める。読めなければ例外を投げる */
  const fill = (config: T): T => (secrets ? secrets.fill(config, readProxySettings) : config);

  const store = async (config: T, callback: () => void): Promise<void> => {
    if (!secrets) return storePluginConfig(config, callback);
    const saved: Record<string, string> = kintone.plugin.app.getConfig(pluginId);
    const previous = parseProxyKeys(saved[PROXY_KEYS_CONFIG_KEY]);
    // setConfig より先に保存する（setConfig を先にすると、秘密の保存に失敗したときに、
    // 実行画面が保存されていない秘密を使おうとするため）
    const keys = await storeProxyEntries(secrets.toEntries(config), previous);
    storePluginConfig({ ...secrets.strip(config), [PROXY_KEYS_CONFIG_KEY]: keys }, callback);
  };

  return {
    ...definition,
    load: () => {
      const result = loadPluginConfig(params());
      try {
        return { ...result, config: fill(result.config) };
      } catch (error) {
        return { config: definition.createDefault(), error: toError(error) };
      }
    },
    parse: (data) => {
      try {
        if (typeof data !== 'object' || data === null || !('version' in data)) {
          throw new Error('設定ファイルに版（version）がありません');
        }
        if (typeof data.version !== 'number') {
          throw new Error('設定ファイルの版（version）が数値ではありません');
        }
        const record = data as Record<string, unknown>;
        const migrated = definition.migrate ? definition.migrate(record) : record;
        return { success: true, data: fill(definition.schema.parse(migrated)) };
      } catch (error) {
        return { success: false, error: toError(error) };
      }
    },
    restore: () => restorePluginConfig(params()),
    store,
    toExport: (config) => (secrets ? secrets.strip(config) : config),
  };
};
