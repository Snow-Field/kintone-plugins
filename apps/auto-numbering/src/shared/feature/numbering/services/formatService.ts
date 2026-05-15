/**
 * フォーマット処理サービス
 */

import type { KintoneRecord } from '@/shared/types/kintone';
import type { ResolvedPart } from '@/shared/types/numbering';
import type { FormatPart, SerialConfig, ConnectorsSchema } from '@/shared/config/staticSchema';
import type { z } from 'zod';
import { DATE_SOURCE } from '@/shared/constant/numbering';
import { createDateContext, formatDate } from '../utils/date';
import { getRecordCreatedAt } from './recordService';

/**
 * 各パーツの値を確定する
 */
export function resolveFormatParts(
  formatParts: FormatPart[],
  record: KintoneRecord
): ResolvedPart[] {
  return formatParts.map((part) => {
    switch (part.type) {
      case 'text':
        return { type: 'text', value: part.value };
      case 'field': {
        const fieldValue = record[part.fieldCode]?.value;
        if (!fieldValue || typeof fieldValue !== 'string') {
          throw new Error(`フィールド "${part.fieldCode}" の値が取得できません`);
        }
        return { type: 'field', value: fieldValue };
      }
      case 'date': {
        // 日付ソース判定
        const isCreatedAt = part.source === DATE_SOURCE.CREATED_AT;
        // レコード作成日時 or 現在日時
        const baseDate = isCreatedAt ? getRecordCreatedAt(record) : '';
        // 日付コンテキストの作成
        const dateCtx = createDateContext(baseDate);

        return { type: 'date', value: formatDate(dateCtx, part.format) };
      }
      default: {
        const unsupportedPart: never = part;
        throw new Error(`未対応のパーツタイプ: ${JSON.stringify(unsupportedPart)}`);
      }
    }
  });
}

/**
 * 連番を除いたパーツを結合する
 */
export function buildFormatString(
  resolvedParts: ResolvedPart[],
  connector: z.infer<typeof ConnectorsSchema>
): string {
  return resolvedParts.map((p) => p.value).join(connector);
}

/**
 * 採番値を構築する
 */
export function buildNumberingValue(
  formatString: string,
  serialString: string,
  position: SerialConfig['position'],
  connector: z.infer<typeof ConnectorsSchema>
): string {
  // prefix: 連番が先頭 → "00001-XX-26"
  if (position === 'prefix') {
    return `${serialString}${connector}${formatString}`;
  }
  // suffix: 連番が末尾 → "XX-26-00001"
  return `${formatString}${connector}${serialString}`;
}
