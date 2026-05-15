import type { UpdateRecordParams } from '@/shared/types/numbering';
import { RESET_TIMING } from '@/shared/constant/numbering';
import { KintoneRestAPIClient } from '@kintone/rest-api-client';

/**
 * RestAPIClientインスタンスを作成
 */
function createClient(apiToken?: string): KintoneRestAPIClient {
  return new KintoneRestAPIClient({
    baseUrl: location.origin,
    auth: apiToken ? { apiToken } : undefined,
  });
}

/**
 * レコードから作成日時を取得する
 */
export function getRecordCreatedAt(record: Record<string, { type: string; value: unknown }>) {
  const createdTime =
    record['作成日時']?.value ??
    Object.values(record).find((f) => f?.type === 'CREATED_TIME')?.value;

  if (typeof createdTime === 'string') {
    return createdTime;
  }

  // 作成日時が見つからない場合は現在時刻を返す
  return new Date().toISOString();
}

/**
 * レコードを取得する（複数）
 */
export async function fetchRecords(
  appId: string | number,
  query: string,
  fields: string[],
  apiToken?: string
) {
  const client = createClient(apiToken);

  const response = await client.record.getRecords({
    app: appId,
    query,
    fields,
  });

  return response.records;
}

/**
 * レコードを取得する（単一）
 */
export async function fetchRecord(
  appId: string | number,
  recordId: string | number,
  apiToken?: string
) {
  const client = createClient(apiToken);

  const response = await client.record.getRecord({
    app: appId,
    id: recordId,
  });

  return response.record;
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
    revision,
    apiToken,
  } = params;

  const { resetTiming, serialFieldCode } = serialConfig;

  const client = createClient(apiToken);

  const record: Record<string, { value: unknown }> = {
    [resultFieldCode]: {
      value: numberingValue,
    },
  };

  // resetTiming が 'none' の場合のみ連番フィールドを更新
  if (resetTiming === RESET_TIMING.NONE && serialFieldCode) {
    record[serialFieldCode] = {
      value: currentSerial,
    };
  }

  await client.record.updateRecord({
    app: appId,
    id: recordId,
    record,
    revision,
  });
}

/**
 * 重複チェック（キャッシュ対応版）
 */
export async function checkDuplicate(
  appId: string | number,
  fieldCode: string,
  value: string,
  existingValues: Set<string>,
  apiToken?: string
): Promise<boolean> {
  // キャッシュにある場合はAPIを呼ばない
  if (existingValues.size > 0) {
    return existingValues.has(value);
  }

  // キャッシュがない場合はAPIで確認
  const query = `${fieldCode} = "${value}" limit 1`;
  const records = await fetchRecords(appId, query, [fieldCode], apiToken);
  return records.length > 0;
}
