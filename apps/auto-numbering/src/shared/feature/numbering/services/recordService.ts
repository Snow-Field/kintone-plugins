/**
 * レコード操作サービス
 */

import type {
  KintoneAPI,
  KintoneProxyHeader,
  KintoneRecord,
  RecordWithRevision,
  FetchRecordsResponse,
  UpdateRecordResponse,
} from '../types/kintone';
import type { NumberingSettings, UpdateRecordParams } from '../types/numbering';
import { RESET_TIMING } from '../types/numbering';
import { callKintoneProxy } from '../utils/kintoneProxy';

/**
 * レコードから作成日時を取得する
 */
export function getRecordCreatedAt(record: KintoneRecord): string {
  const createdTime =
    record['作成日時']?.value ??
    Object.values(record).find((f) => f.type === 'CREATED_TIME')?.value;

  if (typeof createdTime === 'string') {
    return createdTime;
  }

  // 作成日時が見つからない場合は現在時刻を返す
  return new Date().toISOString();
}

/**
 * レコードを取得する
 */
export async function fetchRecords(
  appId: number,
  query: string,
  fields: string[],
  apiToken: NumberingSettings['apiToken'],
  api: KintoneAPI = kintone as unknown as KintoneAPI
): Promise<KintoneRecord[]> {
  // URL作成
  const body = {
    app: appId,
    fields,
    query,
  };
  const url = api.api.urlForGet('/k/v1/records.json', body, true);

  // ヘッダー作成
  const header: KintoneProxyHeader = {};
  if (apiToken) {
    header['X-Cybozu-API-Token'] = apiToken;
  }

  // レコードを取得
  const response = await callKintoneProxy<FetchRecordsResponse>(url, 'GET', header, {}, api);

  return response.records;
}

/**
 * レコードをリビジョン付きで取得する
 */
export async function fetchRecordWithRevision(
  appId: number,
  recordId: number,
  apiToken?: string,
  api: KintoneAPI = kintone as unknown as KintoneAPI
): Promise<RecordWithRevision> {
  const body = {
    app: appId,
    id: recordId,
  };
  const url = api.api.urlForGet('/k/v1/record.json', body, true);

  const header: KintoneProxyHeader = {};
  if (apiToken) {
    header['X-Cybozu-API-Token'] = apiToken;
  }

  const response = await callKintoneProxy<{ record: KintoneRecord; revision: string }>(
    url,
    'GET',
    header,
    {},
    api
  );

  return {
    record: response.record,
    revision: response.revision,
  };
}

/**
 * レコードを更新する（リビジョン対応版）
 */
export async function updateRecord(params: UpdateRecordParams): Promise<void> {
  const {
    appId,
    recordId,
    resultFieldCode,
    numberingValue,
    serialConfig,
    currentSerial,
    header,
    revision,
    api = kintone as unknown as KintoneAPI,
  } = params;

  const { resetTiming, serialFieldCode } = serialConfig;

  const body: {
    app: number;
    id: number;
    record: {
      [key: string]: {
        value: unknown;
      };
    };
    revision?: string;
  } = {
    app: appId,
    id: recordId,
    record: {
      [resultFieldCode]: {
        value: numberingValue,
      },
    },
  };

  // resetTiming が 'none' の場合のみ連番フィールドを更新
  if (resetTiming === RESET_TIMING.NONE && serialFieldCode) {
    body.record[serialFieldCode] = {
      value: currentSerial,
    };
  }

  // リビジョンチェック（競合制御）
  if (revision) {
    body.revision = revision;
  }

  await callKintoneProxy<UpdateRecordResponse>(
    api.api.url('/k/v1/record.json', true),
    'PUT',
    header,
    body,
    api
  );
}

/**
 * 重複チェック（キャッシュ対応版）
 */
export async function checkDuplicate(
  appId: number,
  fieldCode: string,
  value: string,
  existingValues: Set<string>,
  apiToken?: string,
  api: KintoneAPI = kintone as unknown as KintoneAPI
): Promise<boolean> {
  // キャッシュにある場合はAPIを呼ばない
  if (existingValues.size > 0) {
    return existingValues.has(value);
  }

  // キャッシュがない場合はAPIで確認
  const query = `${fieldCode} = "${value}" limit 1`;
  const records = await fetchRecords(appId, query, [fieldCode], apiToken, api);
  return records.length > 0;
}
