/**
 * フォーマット処理サービス
 */

import type { z } from 'zod';
import type { KintoneEvent } from '@/shared/types/kintone';
import type { ResolvedPart } from '@/shared/types/numbering';
import type { FormatPart, SerialConfig, ConnectorsSchema } from '@/shared/config/staticSchema';
import { DATE_SOURCE } from '@/shared/constant/numbering';
import { createDateContext, formatDate } from '../utils/date';
import { getRecordCreatedAt } from './recordService';

/**
 * 各パーツの値を確定する
 * 未設定のパーツはスキップする
 */
export function resolveFormatParts(
  formatParts: FormatPart[],
  record: KintoneEvent['record']
): ResolvedPart[] {
  return formatParts
    .map((part) => {
      switch (part.type) {
        case 'text':
          // 値が未設定の場合はスキップ
          if (!part.value) return null;
          return { type: 'text', value: part.value };

        case 'field': {
          // fieldCodeが未設定の場合はスキップ
          if (!part.fieldCode) return null;
          const fieldValue = record[part.fieldCode]?.value;
          if (!fieldValue || typeof fieldValue !== 'string') {
            throw new Error(`フィールド "${part.fieldCode}" の値が取得できません`);
          }
          return { type: 'field', value: fieldValue };
        }

        case 'date': {
          // sourceまたはformatが未設定の場合はスキップ
          if (!part.source || !part.format) return null;

          // 日付ソース判定
          const isCreatedAt = part.source === DATE_SOURCE.CREATED_AT;
          // レコード作成日時 or 現在日時
          const baseDate = isCreatedAt ? getRecordCreatedAt(record) : new Date().toISOString();
          // 日付コンテキストの作成
          const dateCtx = createDateContext(baseDate);

          return { type: 'date', value: formatDate(dateCtx, part.format) };
        }

        default: {
          const unsupportedPart: never = part;
          throw new Error(`未対応のパーツタイプ: ${JSON.stringify(unsupportedPart)}`);
        }
      }
    })
    .filter((part): part is ResolvedPart => part !== null); // nullを除外
}

/**
 * 連番を除いたパーツを結合する
 * パーツが空の場合は空文字列を返す
 */
export function buildFormatString(
  resolvedParts: ResolvedPart[],
  connector: z.infer<typeof ConnectorsSchema>
): string {
  if (resolvedParts.length === 0) {
    return ''; // パーツなし = 連番のみ
  }
  return resolvedParts.map((p) => p.value).join(connector);
}

/**
 * 採番値を構築する
 * formatStringが空の場合は連番のみを返す
 */
export function buildNumberingValue(
  formatString: string,
  serialString: string,
  position: SerialConfig['position'],
  connector: z.infer<typeof ConnectorsSchema>
): string {
  // パーツがない場合は連番のみ（positionは無視）
  if (!formatString) {
    return serialString;
  }

  // positionが未設定の場合はデフォルトでsuffix
  const actualPosition = position || 'suffix';

  if (actualPosition === 'prefix') {
    // prefix: 連番が先頭 → "00001-XX-26"
    return [serialString, formatString].join(connector);
  }
  // suffix: 連番が末尾 → "XX-26-00001"
  return [formatString, serialString].join(connector);
}
