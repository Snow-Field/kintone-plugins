import { describe, expect, it } from 'vitest';
import type { KintoneEvent } from '@/shared/types/kintone';
import type { FormatPart } from '@/shared/config/staticSchema';
import { buildFormatString, buildNumberingValue, resolveFormatParts } from './formatService';

const record = {
  部署コード: { type: 'SINGLE_LINE_TEXT', value: 'XX' },
  空欄: { type: 'SINGLE_LINE_TEXT', value: '' },
  作成日時: { type: 'CREATED_TIME', value: '2026-03-07T03:00:00Z' },
} as unknown as KintoneEvent['record'];

describe('resolveFormatParts', () => {
  it('テキスト・フィールド・作成日時のパーツを値に変換する', () => {
    const parts: FormatPart[] = [
      { type: 'text', value: 'INV' },
      { type: 'field', fieldCode: '部署コード' },
      { type: 'date', source: 'createdAt', format: 'YYYYMM' },
    ];

    expect(resolveFormatParts(parts, record)).toEqual([
      { type: 'text', value: 'INV' },
      { type: 'field', value: 'XX' },
      { type: 'date', value: '202603' },
    ]);
  });

  it('未設定のパーツは読み飛ばす', () => {
    const parts: FormatPart[] = [
      { type: 'text', value: '' },
      { type: 'field', fieldCode: '' },
      { type: 'date', source: 'createdAt' },
    ];

    expect(resolveFormatParts(parts, record)).toEqual([]);
  });

  it('参照先フィールドの値が空ならエラーにする', () => {
    const parts: FormatPart[] = [{ type: 'field', fieldCode: '空欄' }];
    expect(() => resolveFormatParts(parts, record)).toThrow(
      'フィールド "空欄" の値が取得できません'
    );
  });

  it('参照先フィールドが存在しなければエラーにする', () => {
    const parts: FormatPart[] = [{ type: 'field', fieldCode: '存在しない' }];
    expect(() => resolveFormatParts(parts, record)).toThrow('存在しない');
  });
});

describe('buildFormatString', () => {
  it('パーツを区切り文字で結合する', () => {
    expect(
      buildFormatString(
        [
          { type: 'text', value: 'INV' },
          { type: 'date', value: '2603' },
        ],
        '-'
      )
    ).toBe('INV-2603');
  });

  it('パーツが無ければ空文字列を返す', () => {
    expect(buildFormatString([], '-')).toBe('');
  });
});

describe('buildNumberingValue', () => {
  it('suffix は連番を末尾に付ける', () => {
    expect(buildNumberingValue('XX-26', '00001', 'suffix', '-')).toBe('XX-26-00001');
  });

  it('prefix は連番を先頭に付ける', () => {
    expect(buildNumberingValue('XX-26', '00001', 'prefix', '-')).toBe('00001-XX-26');
  });

  it('position が未設定なら suffix として扱う', () => {
    expect(buildNumberingValue('XX-26', '00001', undefined, '-')).toBe('XX-26-00001');
  });

  it('パーツが無ければ position に関係なく連番のみを返す', () => {
    expect(buildNumberingValue('', '00001', 'prefix', '-')).toBe('00001');
  });
});
