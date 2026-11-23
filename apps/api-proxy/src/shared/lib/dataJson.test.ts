import { describe, expect, it } from 'vitest';
import type { DataItem } from '@/shared/config/staticSchema';
import { dataToJson, jsonToData } from './dataJson';

let seq = 0;
const createId = () => `new-${++seq}`;

describe('dataToJson', () => {
  it('種類に合わせて、文字・数値・真偽の JSON にする', () => {
    const items: DataItem[] = [
      { id: '1', key: 'channel', value: 'C01', type: 'string' },
      { id: '2', key: 'limit', value: '10', type: 'number' },
      { id: '3', key: 'dry', value: 'false', type: 'boolean' },
    ];
    expect(JSON.parse(dataToJson(items))).toEqual({ channel: 'C01', limit: 10, dry: false });
  });

  it('値が空の数値・真偽は null にする（0 や false に見せると、そのまま保存されてしまうため）', () => {
    const items: DataItem[] = [
      { id: '1', key: 'limit', value: '', type: 'number' },
      { id: '2', key: 'dry', value: '', type: 'boolean' },
      { id: '3', key: 'name', value: '', type: 'string' },
    ];
    expect(JSON.parse(dataToJson(items))).toEqual({ limit: null, dry: null, name: '' });
  });
});

describe('jsonToData', () => {
  it('JSON の値から種類を決め、同じキーの行の id は引き継ぐ', () => {
    const current: DataItem[] = [{ id: 'keep', key: 'channel', value: '', type: 'string' }];
    const result = jsonToData('{"channel": "C01", "limit": 10, "dry": true}', current, createId);
    expect(result).toEqual({
      ok: true,
      items: [
        { id: 'keep', key: 'channel', value: 'C01', type: 'string' },
        { id: expect.stringMatching(/^new-/), key: 'limit', value: '10', type: 'number' },
        { id: expect.stringMatching(/^new-/), key: 'dry', value: 'true', type: 'boolean' },
      ],
    });
  });

  it('空なら本文の値を無しにする', () => {
    expect(jsonToData('  ', [], createId)).toEqual({ ok: true, items: [] });
    expect(jsonToData('{}', [], createId)).toEqual({ ok: true, items: [] });
  });

  it.each([
    ['JSON でない', '{channel: C01}', 'JSON として読めません'],
    ['オブジェクトでない', '[1, 2]', 'オブジェクト'],
    ['値がオブジェクト', '{"a": {"b": 1}}', '「a」の値は'],
    ['値が null（空のまま）', '{"a": null}', '「a」の値を入れてください'],
    ['空のキー', '{"": 1}', '空のキー'],
    ['前後に空白のあるキー', '{"a ": 1}', '前後に空白'],
    [
      '大きすぎる整数',
      '{"id": 12345678901234567890}',
      '「id」の数値は、そのままでは保存できません',
    ],
    ['有限でない数値', '{"n": 1e400}', '「n」の数値は、そのままでは保存できません'],
    [
      '細かすぎる小数',
      '{"r": 0.12345678901234567890}',
      '「r」の数値は、そのままでは保存できません',
    ],
    ['指数の書き方', '{"n": 1e3}', '1000 のように書いてください'],
  ])('%s ものは理由を返す', (_, text, message) => {
    const result = jsonToData(text, [], createId);
    expect(result.ok).toBe(false);
    expect(!result.ok && result.message).toContain(message);
  });

  it('JSON にして読み直すと、元の本文の値に戻る', () => {
    const items: DataItem[] = [
      { id: '1', key: 'channel', value: 'C01', type: 'string' },
      { id: '2', key: 'limit', value: '1.5', type: 'number' },
      { id: '3', key: 'dry', value: 'false', type: 'boolean' },
    ];
    expect(jsonToData(dataToJson(items), items, createId)).toEqual({ ok: true, items });
  });
});
