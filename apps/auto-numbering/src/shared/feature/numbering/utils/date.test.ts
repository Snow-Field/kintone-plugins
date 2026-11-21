import { describe, expect, it } from 'vitest';
import { DATE_FORMATS } from '@/shared/constant/numbering';
import { createDateContext, formatDate } from './date';

describe('createDateContext', () => {
  it('月と日を2桁にゼロ埋めする', () => {
    const ctx = createDateContext('2026-01-05T12:00:00');
    expect(ctx).toMatchObject({ yyyy: '2026', mm: '01', dd: '05' });
  });
});

describe('formatDate', () => {
  const ctx = createDateContext('2026-03-07T12:00:00');

  it.each([
    [DATE_FORMATS.YYYYMMDD, '20260307'],
    [DATE_FORMATS.YYMMDD, '260307'],
    [DATE_FORMATS.YYYYMM, '202603'],
    [DATE_FORMATS.YYMM, '2603'],
    [DATE_FORMATS.YYYY, '2026'],
    [DATE_FORMATS.YY, '26'],
  ])('%s → %s', (format, expected) => {
    expect(formatDate(ctx, format)).toBe(expected);
  });
});
