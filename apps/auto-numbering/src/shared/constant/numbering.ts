/**
 * 定数定義
 */

export const FETCH_LIMIT_FOR_RESET = 500;
export const DEFAULT_RETRY_COUNT = 10;

/**
 *  Enum型定義
 */
export const DATE_SOURCE = {
  NOW: 'now' as const,
  CREATED_AT: 'createdAt' as const,
} as const;

export const DATE_FORMATS = {
  YYYYMMDD: 'YYYYMMDD' as const,
  YYMMDD: 'YYMMDD' as const,
  YYYYMM: 'YYYYMM' as const,
  YYMM: 'YYMM' as const,
  YYYY: 'YYYY' as const,
  YY: 'YY' as const,
} as const;

export const CONNECTORS = {
  HYPHEN: '-' as const,
} as const;

export const RESET_TIMING = {
  NONE: 'none' as const,
  YEARLY: 'yearly' as const,
  MONTHLY: 'monthly' as const,
  DAILY: 'daily' as const,
} as const;
