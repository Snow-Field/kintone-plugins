import { KintoneRestAPIClient } from '@kintone/rest-api-client';
import type { UpdateRecordParams } from '@/shared/types/numbering';
import { RESET_TIMING } from '@/shared/config/constants';
import { quoteQueryValue } from '@/shared/lib/query';

/**
 * RestAPIClientインスタンスを作成
 */
function createClient(apiToken?: string): KintoneRestAPIClient {
  return new KintoneRestAPIClient({
    baseUrl: location.origin,
    auth: apiToken ? { apiToken } : undefined,
  });
}

type FetchRecordsQuery = {
  /** 絞り込みの条件（値は quoteQueryValue でエスケープしておく） */
  condition: string;
  /** 並べ方（`order by` は付けない。例: `$id desc`） */
  orderBy: string;
  /** 取得する件数（500 まで） */
  limit: number;
};

/**
 * 条件に合うレコードを、並べた順に先頭から limit 件取得する
 * getAllRecords は orderBy の前に自分で `order by` を付け、limit も受け付けないので使わない
 */
export async function fetchRecords(
  appId: string | number,
  { condition, orderBy, limit }: FetchRecordsQuery,
  fields: string[],
  apiToken?: string
) {
  const client = createClient(apiToken);

  const { records } = await client.record.getRecords({
    app: appId,
    query: `${condition} order by ${orderBy} limit ${limit}`,
    fields,
  });

  return records;
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
 * 重複チェック
 * 取得済みの採番値にあれば API を呼ばない。無くても、取得した件数に上限があるので API で確かめる
 */
export async function checkDuplicate(
  appId: string | number,
  fieldCode: string,
  numberingValue: string,
  existingValues: Set<string>,
  apiToken?: string
): Promise<boolean> {
  if (existingValues.has(numberingValue)) return true;

  const records = await fetchRecords(
    appId,
    {
      condition: `${fieldCode} = ${quoteQueryValue(numberingValue)}`,
      orderBy: '$id desc',
      limit: 1,
    },
    [fieldCode],
    apiToken
  );
  return records.length > 0;
}
