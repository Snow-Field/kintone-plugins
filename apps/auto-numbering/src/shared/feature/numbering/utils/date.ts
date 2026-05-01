/**
 * 日付ユーティリティ
 */

import type { DateContext } from '../types/numbering';
import { DATE_FORMATS } from '../types/numbering';
import { padZero } from './string';

/**
 * 日付コンテキストを作成
 * タイムゾーンを考慮してJSTで処理
 */
export function createDateContext(dateString?: string): DateContext {
  const date = dateString ? new Date(dateString) : new Date();

  // JSTでの年月日を取得
  const yyyy = String(date.getFullYear());
  const mm = padZero(date.getMonth() + 1, 2);
  const dd = padZero(date.getDate(), 2);

  return { date, yyyy, mm, dd };
}

/**
 * 日付フォーマット
 */
export function formatDate(ctx: DateContext, format: DATE_FORMATS): string {
  const { yyyy, mm, dd } = ctx;
  const yy = yyyy.slice(-2);

  switch (format) {
    case DATE_FORMATS.YYYYMMDD:
      return `${yyyy}${mm}${dd}`;
    case DATE_FORMATS.YYMMDD:
      return `${yy}${mm}${dd}`;
    case DATE_FORMATS.YYYYMM:
      return `${yyyy}${mm}`;
    case DATE_FORMATS.YYMM:
      return `${yy}${mm}`;
    case DATE_FORMATS.YYYY:
      return yyyy;
    case DATE_FORMATS.YY:
      return yy;
    default:
      return '';
  }
}
