/**
 * 連番管理サービス
 */

import type { SerialContext } from '@/shared/types/numbering';
import { RESET_TIMING, FETCH_LIMIT_FOR_RESET } from '@/shared/config/constants';
import { quoteQueryValue } from '@/shared/lib/query';
import { extractMaxSerial, matchesFormat } from '@/shared/lib/serial';
import { fetchRecords } from './records';

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

      // リセットなし → 全期間で最大の連番を取得
      const records = await fetchRecords(
        appId,
        { condition: `${serialFieldCode} != ""`, orderBy: `${serialFieldCode} desc`, limit: 1 },
        [resultFieldCode, serialFieldCode],
        apiToken
      );

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
      // formatStringが空の場合は期間リセットが機能しないため、エラー
      if (!formatString || formatString.trim() === '') {
        throw new Error(
          `リセットタイミング "${resetTiming}" を使用する場合、フォーマットパーツに適切な日付を含める必要があります`
        );
      }

      // 期間リセット → formatString（連番を除く部分）を含む採番値を探す
      const records = await fetchRecords(
        appId,
        {
          condition: `${resultFieldCode} like ${quoteQueryValue(formatString)}`,
          orderBy: '$id desc',
          limit: FETCH_LIMIT_FOR_RESET,
        },
        [resultFieldCode],
        apiToken
      );

      // like は部分一致なので、同じ書式の採番値だけを残す
      const existingValues = new Set(
        records
          .map((r) => r[resultFieldCode]?.value)
          .filter((v): v is string => typeof v === 'string' && matchesFormat(ctx, v))
      );

      if (existingValues.size === 0) {
        return { nextSerial: initialValue, existingValues };
      }

      return { nextSerial: extractMaxSerial(ctx, [...existingValues]) + 1, existingValues };
    }
    default: {
      const exhaustiveCheck: never = resetTiming;
      throw new Error(`未対応のリセットタイミング: ${exhaustiveCheck}`);
    }
  }
}
