import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { calculateAge } from './calculateAge';

/** 現在日時をローカル時刻の年月日で固定する */
const setToday = (year: number, month: number, day: number) => {
  vi.setSystemTime(new Date(year, month - 1, day, 12, 0, 0));
};

describe('calculateAge', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('誕生日当日は満年齢になる', () => {
    setToday(2026, 5, 10);
    expect(calculateAge('2000-05-10')).toBe(26);
  });

  it('誕生日の前日はまだ1つ下の年齢になる', () => {
    setToday(2026, 5, 9);
    expect(calculateAge('2000-05-10')).toBe(25);
  });

  it('誕生月より前の月は1つ下の年齢になる', () => {
    setToday(2026, 4, 30);
    expect(calculateAge('2000-05-10')).toBe(25);
  });

  it('誕生月より後の月は満年齢になる', () => {
    setToday(2026, 6, 1);
    expect(calculateAge('2000-05-10')).toBe(26);
  });

  it('年をまたぐ境界（12/31 生まれ）', () => {
    setToday(2026, 12, 30);
    expect(calculateAge('2000-12-31')).toBe(25);
    setToday(2026, 12, 31);
    expect(calculateAge('2000-12-31')).toBe(26);
  });

  it('2/29 生まれは、うるう年でない年は 3/1 に年を取る', () => {
    setToday(2027, 2, 28);
    expect(calculateAge('2000-02-29')).toBe(26);
    setToday(2027, 3, 1);
    expect(calculateAge('2000-02-29')).toBe(27);
  });

  it('生まれた日は 0 歳になる', () => {
    setToday(2026, 5, 10);
    expect(calculateAge('2026-05-10')).toBe(0);
  });
});
