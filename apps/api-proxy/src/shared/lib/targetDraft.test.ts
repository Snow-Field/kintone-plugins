import { describe, expect, it } from 'vitest';
import type { Target } from '@/shared/config/staticSchema';
import { draftWarning, fromDraft, toDraft } from './targetDraft';

const URL = 'https://example.cybozu.com/k/v1/';
let seq = 0;
const createId = () => `new-${++seq}`;

const target = (overrides: Partial<Target> = {}): Target => ({
  id: 't',
  url: URL,
  methods: ['GET'],
  headers: [{ id: 'h', key: 'X-Cybozu-API-Token', value: 'token' }],
  data: [],
  memo: '説明',
  enabled: true,
  ...overrides,
});

describe('toDraft', () => {
  it('ヘッダーは JSON に、無いデータは空の欄にする', () => {
    const draft = toDraft(target());
    expect(JSON.parse(draft.headersText)).toEqual({ 'X-Cybozu-API-Token': 'token' });
    expect(draft.dataText).toBe('');
    expect(draft).toMatchObject({ url: URL, methods: ['GET'], memo: '説明' });
  });
});

describe('fromDraft', () => {
  it('下書きを接続先に戻す（id と行の id は引き継ぐ）', () => {
    const base = target();
    const result = fromDraft(
      { ...toDraft(base), memo: '新しい説明', dataText: '{"limit": 10}' },
      base,
      [],
      0,
      createId
    );
    expect(result).toEqual({
      ok: true,
      target: {
        ...base,
        memo: '新しい説明',
        data: [{ id: expect.any(String), key: 'limit', value: '10', type: 'number' }],
      },
    });
  });

  it('JSON の誤りは、その欄のエラーにする', () => {
    const result = fromDraft(
      { ...toDraft(target()), headersText: '{', dataText: '[1]' },
      target(),
      [],
      0,
      createId
    );
    expect(result.ok).toBe(false);
    expect(!result.ok && result.errors.headersText).toContain('JSON として読めません');
    expect(!result.ok && result.errors.dataText).toContain('オブジェクト');
  });

  it('URL・メソッド・ヘッダーの値の誤りを、それぞれの欄に割り当てる（ヘッダーはキーを添える）', () => {
    const result = fromDraft(
      { url: 'ftp://x', methods: [], headersText: '{"Authorization": ""}', dataText: '', memo: '' },
      target(),
      [],
      0,
      createId
    );
    expect(result).toEqual({
      ok: false,
      errors: {
        url: 'URL は https:// で始めてください（http は値が暗号化されずに送られるため使えません）',
        methods: 'メソッドを1つ以上選んでください',
        headersText: 'Authorization: ヘッダーの値を入力してください',
      },
    });
  });

  it('ほかの接続先と URL とメソッドの組が重なれば、エラーにする（位置は others に入れた位置で数える）', () => {
    const other = target({ id: 'other' });
    const result = fromDraft(toDraft(target()), target({ id: 'new' }), [other], 1, createId);
    expect(!result.ok && result.errors.methods).toBe(
      '1番目の接続先と、URL と GET の組が重なっています'
    );
  });
});

describe('fromDraft（下の行との重なり）', () => {
  it('編集中の行が上にあっても、下の行と URL とメソッドの組が重なればエラーにする', () => {
    const below = target({ id: 'below' });
    const result = fromDraft(toDraft(target()), target({ id: 'edit' }), [below], 0, createId);
    expect(!result.ok && result.errors.methods).toBe(
      '2番目の接続先と、URL と GET の組が重なっています'
    );
  });
});

describe('draftWarning', () => {
  it('同じキーの行が複数あれば知らせる', () => {
    expect(draftWarning(target())).toBeUndefined();
    expect(
      draftWarning(
        target({
          headers: [
            { id: '1', key: 'A', value: 'x' },
            { id: '2', key: 'A', value: 'y' },
          ],
        })
      )
    ).toContain('同じキー（A）');
  });
});
