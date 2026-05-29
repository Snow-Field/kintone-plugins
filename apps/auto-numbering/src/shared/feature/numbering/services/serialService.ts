/**
 * 連番管理サービス
 */

import type { SerialContext } from '@/shared/types/numbering';
import { RESET_TIMING, FETCH_LIMIT_FOR_RESET } from '@/shared/constant/numbering';
import { fetchRecords } from './recordService';

/**
 * レコードから連番を抽出する
 */
function extractSerialWithResets(
  ctx: SerialContext,
  records: Array<Record<string, { type: string; value: unknown }>>
): number {
  const { resultFieldCode, serialConfig, connector } = ctx;
  const { position } = serialConfig;

  // 連番の開始位置
  const isPrefix = position === 'prefix';

  // リセットあり → resultFieldCodeの値を分割して最大連番を探す
  let maxSerial = 0;
  for (const record of records) {
    const fieldValue = record[resultFieldCode]?.value;
    const fullValue = typeof fieldValue === 'string' ? fieldValue : String(fieldValue ?? '');
    const segments = fullValue.split(connector);
    // positionに応じて先頭or末尾から連番セグメントを特定
    const serialSegment = isPrefix ? segments[0] : segments[segments.length - 1];
    const serialNum = Number(serialSegment);
    // 数値変換できないレコードはスキップ（手入力による異常値の可能性）
    if (Number.isNaN(serialNum)) continue;
    if (serialNum > maxSerial) {
      maxSerial = serialNum;
    }
  }

  return maxSerial;
}

/**
 * 次の連番を決定する
 */
export async function resolveNextSerial(
  ctx: SerialContext
): Promise<{ nextSerial: number; existingValues: Set<string> }> {
  const { appId, apiToken, resultFieldCode, serialConfig, formatString } = ctx;
  const { initialValue, resetTiming, serialFieldCode } = serialConfig;

  switch (resetTiming) {
    case RESET_TIMING.NONE: {
      if (!serialFieldCode) {
        throw new Error('resetTiming が "none" の場合、serialFieldCode は必須です');
      }

      const condition = `${serialFieldCode} != ""`;
      const orderBy = `order by ${serialFieldCode} desc limit 1`;
      const fields = [resultFieldCode, serialFieldCode];

      // リセットなし → 全期間で最大の連番を取得
      const records = await fetchRecords(appId, condition, orderBy, fields, apiToken);

      // レコードから連番を抽出
      if (records.length === 0) {
        return { nextSerial: initialValue, existingValues: new Set<string>() };
      }

      const serialValue = records[0][serialFieldCode]?.value;
      const serialNumber = typeof serialValue === 'number' ? serialValue : Number(serialValue);

      if (Number.isNaN(serialNumber)) {
        throw new Error(`不正な連番値: ${serialValue}`);
      }

      return { nextSerial: serialNumber + 1, existingValues: new Set<string>() };
    }
    case RESET_TIMING.YEARLY:
    case RESET_TIMING.MONTHLY:
    case RESET_TIMING.DAILY: {
      const condition = `${resultFieldCode} like "${formatString}"`;
      const orderBy = `order by $id desc limit ${FETCH_LIMIT_FOR_RESET}`;
      const fields = [resultFieldCode];

      // 期間リセット → formatString（連番を除く部分）で一致検索
      const records = await fetchRecords(appId, condition, orderBy, fields, apiToken);

      // 既存の採番値をキャッシュ
      const existingValues = new Set(
        records
          .map((r) => {
            const value = r[resultFieldCode]?.value;
            return typeof value === 'string' ? value : String(value ?? '');
          })
          .filter((v) => v !== '')
      );

      // レコードから連番を抽出
      if (records.length === 0) {
        return { nextSerial: initialValue, existingValues };
      }

      const maxSerialNumber = extractSerialWithResets(ctx, records);

      return { nextSerial: maxSerialNumber + 1, existingValues };
    }
    default: {
      const exhaustiveCheck: never = resetTiming;
      throw new Error(`未対応のリセットタイミング: ${exhaustiveCheck}`);
    }
  }
}
