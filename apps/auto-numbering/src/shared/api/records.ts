import type { KintoneRecordField } from '@kintone/rest-api-client';
import type { UpdateRecordParams } from '@/shared/types/numbering';
import { RESET_TIMING } from '@/shared/config/constants';
import { quoteQueryValue } from '@/shared/lib/query';
import { type ApiAuth, requestApi } from './request';

type KintoneRecord = Record<string, KintoneRecordField.OneOf>;

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
  auth: ApiAuth
): Promise<KintoneRecord[]> {
  const { records } = await requestApi<{ records: KintoneRecord[] }>(
    'records.json',
    'GET',
    { app: appId, query: `${condition} order by ${orderBy} limit ${limit}`, fields },
    auth
  );

  return records;
}

/**
 * レコードを取得する（単一）
 */
export async function fetchRecord(
  appId: string | number,
  recordId: string | number,
  auth: ApiAuth
): Promise<KintoneRecord> {
  const { record } = await requestApi<{ record: KintoneRecord }>(
    'record.json',
    'GET',
    { app: appId, id: recordId },
    auth
  );

  return record;
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
    auth,
  } = params;

  const { resetTiming, serialFieldCode } = serialConfig;

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

  // リビジョンが取れなかったときは送らない（空の値は不正なリビジョンとして拒否されうるため）
  const body =
    revision === undefined || revision === ''
      ? { app: appId, id: recordId, record }
      : { app: appId, id: recordId, record, revision };
  await requestApi('record.json', 'PUT', body, auth);
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
  auth: ApiAuth
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
    auth
  );
  return records.length > 0;
}
