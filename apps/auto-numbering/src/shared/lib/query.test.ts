import { describe, expect, it } from 'vitest';
import { quoteQueryValue } from './query';

describe('quoteQueryValue', () => {
  it('値をダブルクォートで囲む', () => {
    expect(quoteQueryValue('営業部-26-00001')).toBe('"営業部-26-00001"');
  });

  it('ダブルクォートとバックスラッシュをエスケープする（検索条件が壊れないように）', () => {
    expect(quoteQueryValue('A"B')).toBe('"A\\"B"');
    expect(quoteQueryValue('A\\B')).toBe('"A\\\\B"');
    expect(quoteQueryValue('"" or $id > 0')).toBe('"\\"\\" or $id > 0"');
  });
});
