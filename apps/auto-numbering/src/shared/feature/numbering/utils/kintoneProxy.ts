/**
 * Kintone API ユーティリティ
 */

import type { KintoneAPI, KintoneProxyData, KintoneProxyHeader } from '../types/kintone';
import { HTTP_STATUS_OK } from '../config/constants';

/**
 * kintone.proxyのラッパー
 */
export async function callKintoneProxy<T>(
  url: string,
  method: string,
  header: KintoneProxyHeader,
  data: KintoneProxyData,
  api: KintoneAPI = kintone as unknown as KintoneAPI
): Promise<T> {
  const [body, status] = await api.proxy(url, method, header, data);

  if (status !== HTTP_STATUS_OK) {
    throw new Error(`kintone API Error: ${status} - ${body}`);
  }

  return JSON.parse(body) as T;
}

/**
 * APIヘッダーを作成
 */
export function createApiHeader(apiToken?: string): KintoneProxyHeader {
  const header: KintoneProxyHeader = { 'Content-Type': 'application/json' };
  if (apiToken) {
    header['X-Cybozu-API-Token'] = apiToken;
  }
  return header;
}
