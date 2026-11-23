/**
 * kintone REST API の呼び出し
 * API トークンを設定していれば、プロキシ設定に保存したトークンを kintone.plugin.app.proxy で付けて呼ぶ。
 * 設定していなければ、ログイン中の利用者のセッションで kintone.api を呼ぶ
 */
import { type ProxyEntry, type ProxyKey, requestViaProxy } from '@kintone-plugin/kintone-utils';
import { parseProxyResponse, type QueryParams, toQueryString } from '@/shared/lib/request';

/** API トークンのヘッダー名 */
export const API_TOKEN_HEADER = 'X-Cybozu-API-Token';

type ApiMethod = 'GET' | 'PUT';

/**
 * トークンを付ける REST API（採番で使うものだけ）
 * kintone は URL の前方一致で値を付けるので、`/k/v1/` 全体ではなく API ごとに保存し、
 * 利用者が開発者ツールから proxy を呼んでも、ほかの API にはトークンが付かないようにする
 */
const TOKEN_TARGETS: readonly { path: string; method: ApiMethod }[] = [
  { path: 'records.json', method: 'GET' },
  { path: 'record.json', method: 'GET' },
  { path: 'record.json', method: 'PUT' },
];

/**
 * プラグイン ID は読み込み時に読む（kintone.$PLUGIN_ID は、プラグインのスクリプトの読み込み時にしか
 * 正しい値が保証されないため）
 */
const PLUGIN_ID: string = kintone.$PLUGIN_ID;

/** 呼び出し方。API トークンをプロキシ設定に保存していれば true */
export type ApiAuth = { useApiToken: boolean };

/**
 * REST API の URL。ゲストスペースのアプリでは /k/guest/{スペースID}/v1/ になる
 * 設定画面で保存する URL と、実行画面で呼ぶ URL の両方をこれで作る（前方一致で値が付くため）
 */
export const apiUrl = (path: string): string => kintone.api.url(`/k/v1/${path}`, true);

/** API トークンを保存するプロキシ設定の組 */
export const apiTokenEntries = (token: string): ProxyEntry[] =>
  TOKEN_TARGETS.map(({ path, method }) => ({
    url: apiUrl(path),
    method,
    headers: { [API_TOKEN_HEADER]: token },
    data: {},
  }));

/** トークンを保存しうるキー（保存のたびに、今回保存しないものを {} で上書きする） */
export const apiTokenKeys = (): ProxyKey[] =>
  TOKEN_TARGETS.map(({ path, method }) => ({ url: apiUrl(path), method }));

/** 保存済みのトークンを読むときのキー（どの組にも同じトークンを保存するので、最初の組を読む） */
export const apiTokenReadKey = (): ProxyKey => {
  const [first] = TOKEN_TARGETS;
  if (!first) throw new Error('トークンを付ける REST API がありません');
  return { url: apiUrl(first.path), method: first.method };
};

/** kintone.api の失敗（エラーのオブジェクト）を Error にそろえる */
const toApiError = (error: unknown): Error => {
  if (error instanceof Error) return error;
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const { code, message } = error as { code?: unknown; message?: unknown };
    return new Error(
      `kintone REST API の呼び出しに失敗しました${typeof code === 'string' ? `（${code}）` : ''}: ${String(message)}`
    );
  }
  return new Error(String(error));
};

/**
 * kintone REST API を呼ぶ
 * @param path `/k/v1/` より後ろ（例: `records.json`）
 * @param params GET はクエリ、PUT は本文にする
 */
export async function requestApi<T>(
  path: string,
  method: ApiMethod,
  params: Record<string, unknown>,
  { useApiToken }: ApiAuth
): Promise<T> {
  if (!useApiToken) {
    try {
      return (await kintone.api(apiUrl(path), method, params)) as T;
    } catch (error) {
      throw toApiError(error);
    }
  }

  const url =
    method === 'GET' ? `${apiUrl(path)}?${toQueryString(params as QueryParams)}` : apiUrl(path);
  const body = method === 'GET' ? {} : JSON.stringify(params);
  const headers: Record<string, string> =
    method === 'GET' ? {} : { 'Content-Type': 'application/json' };
  try {
    const { status, body: responseBody } = await requestViaProxy(
      PLUGIN_ID,
      { url, method },
      headers,
      body
    );
    return parseProxyResponse<T>(status, responseBody);
  } catch (error) {
    throw toApiError(error);
  }
}
