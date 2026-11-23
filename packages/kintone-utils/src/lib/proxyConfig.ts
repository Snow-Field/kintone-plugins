/**
 * プロキシ設定（kintone.plugin.app.setProxyConfig）に秘密を保存する
 * 通常のプラグイン設定（setConfig）は実行画面から誰でも読めるため、API トークンなどはこちらに置く。
 * 保存した値は kintone のサーバーが kintone.plugin.app.proxy のリクエストに付け、ブラウザには届かない
 */

export type ProxyMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

/** プロキシ設定の組を指すキー（kintone はアプリ・プラグイン・メソッド・URL の前方一致で値を付ける） */
export type ProxyKey = { url: string; method: ProxyMethod };

/** 本文の値。オブジェクトは使えない（kintone の仕様） */
export type ProxyDataValue = string | number | boolean;

/** 保存済みのプロキシ設定。ヘッダーの値は文字列で返る */
export type ProxySettings = {
  headers: Record<string, string>;
  data: Record<string, ProxyDataValue>;
};

/** プロキシ設定に保存する1件 */
export type ProxyEntry = ProxyKey & ProxySettings;

/** 保存済みのプロキシ設定を読む関数（設定画面でだけ使える。無ければ null） */
export type ProxySettingsReader = (key: ProxyKey) => ProxySettings | null;

/**
 * 秘密の扱い方。definePluginConfig に渡す
 * フォームでは秘密を含めて扱い、setConfig とエクスポートには strip した形を入れる
 */
export type PluginSecrets<T> = {
  /** フォームの値から、プロキシ設定に保存する組を作る */
  toEntries: (config: T) => ProxyEntry[];
  /** 秘密を除いた形を作る（setConfig とエクスポートに入れる） */
  strip: (config: T) => T;
  /** 保存済みの秘密をフォームの値に戻す（設定画面の読み込みとインポートのあと） */
  fill: (config: T, read: ProxySettingsReader) => T;
  /**
   * 保存しうるキーが決まっていれば返す。保存のたびに、今回保存しないものを {} で上書きする
   * （前回の保存が途中で失敗し、予約キーに記録されなかった組も消せるように）
   */
  knownKeys?: (config: T) => ProxyKey[];
};

/**
 * 前回保存したプロキシ設定のキーを入れる、setConfig の予約キー
 * プロキシ設定は一覧で読めず削除もできないため、消えた組を {} で上書きするのに使う
 */
export const PROXY_KEYS_CONFIG_KEY = '__proxyKeys';

/** あとから新しい保存が始まったので、この保存の残りの書き込みをやめた */
export class SaveSupersededError extends Error {
  constructor() {
    super('新しい保存が始まったため、前の保存を途中でやめました');
    this.name = 'SaveSupersededError';
  }
}

const sameKey = (a: ProxyKey, b: ProxyKey) => a.url === b.url && a.method === b.method;

/**
 * 保存する組と前回のキーから、{} で上書きして無効にするキーを求める
 */
export const staleProxyKeys = (entries: ProxyEntry[], previous: ProxyKey[]): ProxyKey[] =>
  previous.filter((key) => !entries.some((entry) => sameKey(entry, key)));

/** キーの一覧をまとめる（重なりは1つにする） */
export const mergeProxyKeys = (...lists: ProxyKey[][]): ProxyKey[] =>
  lists
    .flat()
    .filter((key, i, all) => all.findIndex((other) => sameKey(other, key)) === i)
    .map(({ url, method }) => ({ url, method }));

/** 同じキーの組が2つあると、後の保存で先の保存が上書きされて気づけないため拒否する */
const assertUniqueKeys = (entries: ProxyEntry[]) => {
  entries.forEach((entry, i) => {
    if (entries.findIndex((other) => sameKey(other, entry)) !== i) {
      throw new Error(`プロキシ設定の組が重複しています: ${entry.method} ${entry.url}`);
    }
  });
};

const PROXY_METHODS: readonly string[] = ['GET', 'POST', 'PUT', 'DELETE'];

/** setProxyConfig に渡せるキーか（渡せないものを混ぜると、保存が毎回失敗するため） */
const isProxyKey = (value: unknown): value is ProxyKey => {
  if (typeof value !== 'object' || value === null) return false;
  const { url, method } = value as Record<string, unknown>;
  return (
    typeof url === 'string' &&
    url !== '' &&
    typeof method === 'string' &&
    PROXY_METHODS.includes(method)
  );
};

/**
 * setConfig の生の値から、前回保存したキーを読む
 * 形が壊れていたら空として扱う（消し漏れが出るだけで、保存は続けられるため）
 */
export const parseProxyKeys = (raw: string | undefined): ProxyKey[] => {
  if (raw === undefined) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isProxyKey) : [];
  } catch {
    return [];
  }
};

/** setProxyConfig の完了を待つ（コールバックを渡さないとプラグイン一覧の画面へ移るため、必ず渡す） */
const setProxySettings = ({ url, method, headers, data }: ProxyEntry): Promise<void> =>
  new Promise((resolve, reject) => {
    try {
      kintone.plugin.app.setProxyConfig(url, method, headers, data, resolve);
    } catch (error) {
      reject(error);
    }
  });

/**
 * プロキシ設定を保存し、前回あって今回無い組を {} で上書きする
 * 戻り値は今回保存したキー（setConfig の予約キーに入れる）
 */
export const storeProxyEntries = async (
  entries: ProxyEntry[],
  previous: ProxyKey[],
  /** false を返したら、残りを書かずに失敗する（あとから始まった保存を上書きしないため） */
  isCurrent: () => boolean = () => true
): Promise<ProxyKey[]> => {
  assertUniqueKeys(entries);
  const writes = [
    ...entries,
    ...staleProxyKeys(entries, previous).map((key) => ({ ...key, headers: {}, data: {} })),
  ];
  // 並行させない（kintone が同時の保存をどう扱うか分からないため）
  for (const write of writes) {
    if (!isCurrent()) throw new SaveSupersededError();
    await setProxySettings(write);
  }
  return entries.map(({ url, method }) => ({ url, method }));
};

/**
 * 保存済みのプロキシ設定を読む（設定画面でだけ使える）
 * {} で無効にした組も、無いものとして扱う
 */
export const readProxySettings: ProxySettingsReader = ({ url, method }) => {
  const saved: unknown = kintone.plugin.app.getProxyConfig(url, method);
  if (typeof saved !== 'object' || saved === null) return null;
  const { headers = {}, data = {} } = saved as Partial<ProxySettings>;
  if (Object.keys(headers).length === 0 && Object.keys(data).length === 0) return null;
  return { headers, data };
};

/** kintone.plugin.app.proxy の応答 */
export type ProxyResponse = { body: string; status: number; headers: Record<string, string> };

/**
 * kintone.plugin.app.proxy を呼ぶ（実行画面で使う）
 * 4xx・5xx でも失敗にならず応答が返るため、ステータスの判定は呼び出し側で行う
 */
export const requestViaProxy = async (
  pluginId: string,
  { url, method }: ProxyKey,
  headers: Record<string, string>,
  body: string | Record<string, unknown>
): Promise<ProxyResponse> => {
  const result: unknown = await kintone.plugin.app.proxy(pluginId, url, method, headers, body);
  if (!Array.isArray(result) || typeof result[0] !== 'string' || typeof result[1] !== 'number') {
    throw new Error('kintone.plugin.app.proxy の応答の形が想定と異なります');
  }
  const [responseBody, status, responseHeaders] = result as [string, number, unknown];
  return {
    body: responseBody,
    status,
    headers: (responseHeaders ?? {}) as Record<string, string>,
  };
};
