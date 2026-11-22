import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resolveAgeValue } from './resolveAgeValue';

const base = {
  birthday: '2000-04-01',
  currentAge: '',
  ageFieldType: 'NUMBER',
  unit: '',
  isUpdateOnSave: false,
} as const;

describe('resolveAgeValue', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 10, 23, 12, 0, 0));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('年齢が空なら、計算した年齢を返す', () => {
    expect(resolveAgeValue(base)).toBe('26');
  });

  it('年齢が入っていて、計算し直さない設定なら書き込まない', () => {
    expect(resolveAgeValue({ ...base, currentAge: '20' })).toBeUndefined();
  });

  it('年齢が入っていても、計算し直す設定なら書き込む', () => {
    expect(resolveAgeValue({ ...base, currentAge: '20', isUpdateOnSave: true })).toBe('26');
  });

  it('文字列（1行）のフィールドには単位を付ける', () => {
    expect(resolveAgeValue({ ...base, ageFieldType: 'SINGLE_LINE_TEXT', unit: '歳' })).toBe('26歳');
  });

  it('数値のフィールドには単位を付けない', () => {
    expect(resolveAgeValue({ ...base, unit: '歳' })).toBe('26');
  });

  it('誕生日が空なら、年齢を空にする（NaN を書き込まない）', () => {
    expect(
      resolveAgeValue({
        ...base,
        birthday: '',
        currentAge: '20歳',
        ageFieldType: 'SINGLE_LINE_TEXT',
        unit: '歳',
        isUpdateOnSave: true,
      })
    ).toBe('');
  });

  it('誕生日が未来の日付なら、年齢を空にする（負の年齢を書き込まない）', () => {
    expect(resolveAgeValue({ ...base, birthday: '2030-01-01' })).toBe('');
  });

  it('誕生日が空でも、年齢が入っていて計算し直さない設定なら触らない', () => {
    expect(resolveAgeValue({ ...base, birthday: '', currentAge: '20' })).toBeUndefined();
  });
});
