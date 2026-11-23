import { describe, expect, it, vi } from 'vitest';
import type { Target } from '@/shared/config/staticSchema';
import {
  countApiTokens,
  fillTargets,
  isApiTokenHeader,
  kintoneApiBaseUrl,
  overlappingTargets,
  stripTargets,
  toProxyEntries,
  validateTargets,
} from './targets';

const ORIGIN = 'https://example.cybozu.com';

const target = (overrides: Partial<Target> = {}): Target => ({
  id: 't',
  url: `${ORIGIN}/k/v1/`,
  methods: ['GET', 'PUT'],
  headers: [{ id: 'h', key: 'X-Cybozu-API-Token', value: 'token' }],
  data: [],
  memo: '',
  ...overrides,
});

/** 検証の結果を「項目: メッセージ」の形にする（読みやすくするため） */
const issues = (targets: Target[]) =>
  validateTargets(targets).map(({ path, message }) => `${path.join('.')}: ${message}`);

describe('kintoneApiBaseUrl', () => {
  it('通常は /k/v1/、ゲストスペースは /k/guest/{ID}/v1/', () => {
    expect(kintoneApiBaseUrl(ORIGIN)).toBe(`${ORIGIN}/k/v1/`);
    expect(kintoneApiBaseUrl(ORIGIN, '3')).toBe(`${ORIGIN}/k/guest/3/v1/`);
  });
});

describe('isApiTokenHeader・countApiTokens', () => {
  it('ヘッダー名は大文字小文字と前後の空白を区別しない', () => {
    expect(isApiTokenHeader(' x-cybozu-api-token ')).toBe(true);
    expect(isApiTokenHeader('Authorization')).toBe(false);
  });

  it('カンマ区切りのトークンを数え、空の要素は数えない', () => {
    expect(countApiTokens('a, b,,c,')).toBe(3);
  });
});

describe('toProxyEntries', () => {
  it('選んだメソッドごとに1件作り、ヘッダーの値の前後の空白を除く', () => {
    const entries = toProxyEntries([
      target({
        url: ` ${ORIGIN}/k/v1/ `,
        headers: [{ id: 'h', key: ' X-Cybozu-API-Token ', value: ' a,b\n' }],
      }),
    ]);
    expect(entries).toEqual([
      { url: `${ORIGIN}/k/v1/`, method: 'GET', headers: { 'X-Cybozu-API-Token': 'a,b' }, data: {} },
      { url: `${ORIGIN}/k/v1/`, method: 'PUT', headers: { 'X-Cybozu-API-Token': 'a,b' }, data: {} },
    ]);
  });

  it('本文の値は種類に合わせて変換する', () => {
    const [entry] = toProxyEntries([
      target({
        methods: ['POST'],
        headers: [],
        data: [
          { id: '1', key: 'channel', value: 'C01', type: 'string' },
          { id: '2', key: 'limit', value: '10', type: 'number' },
          { id: '3', key: 'dry', value: 'false', type: 'boolean' },
        ],
      }),
    ]);
    expect(entry?.data).toEqual({ channel: 'C01', limit: 10, dry: false });
  });
});

describe('stripTargets・fillTargets', () => {
  it('strip はヘッダーと本文の値だけを空にする（キー・URL・メモは残す）', () => {
    const [stripped] = stripTargets([
      target({ data: [{ id: 'd', key: 'k', value: 'v', type: 'string' }], memo: 'メモ' }),
    ]);
    expect(stripped).toEqual(
      target({
        headers: [{ id: 'h', key: 'X-Cybozu-API-Token', value: '' }],
        data: [{ id: 'd', key: 'k', value: '', type: 'string' }],
        memo: 'メモ',
      })
    );
  });

  it('fill はヘッダー名の大文字小文字が違っていても値を戻す', () => {
    const [filled] = fillTargets(stripTargets([target()]), () => ({
      headers: { 'x-cybozu-api-token': 'saved' },
      data: {},
    }));
    expect(filled?.headers[0]?.value).toBe('saved');
  });

  it('fill は最初のメソッドの保存済みの値を、キーで戻す（数値と真偽は文字にする）', () => {
    const read = vi.fn(() => ({
      headers: { 'X-Cybozu-API-Token': 'saved' },
      data: { limit: 10 },
    }));
    const [filled] = fillTargets(
      stripTargets([target({ data: [{ id: 'd', key: 'limit', value: '', type: 'number' }] })]),
      read
    );
    expect(read).toHaveBeenCalledWith({ url: `${ORIGIN}/k/v1/`, method: 'GET' });
    expect(filled?.headers[0]?.value).toBe('saved');
    expect(filled?.data[0]?.value).toBe('10');
  });

  it('保存済みの値が無いキーと接続先は、そのまま残す', () => {
    const [filled] = fillTargets([target()], () => ({ headers: {}, data: {} }));
    expect(filled?.headers[0]?.value).toBe('token');
    expect(fillTargets([target()], () => null)).toEqual([target()]);
  });
});

describe('validateTargets', () => {
  it('正しい接続先には何も返さない', () => {
    expect(issues([target()])).toEqual([]);
  });

  it('URL・メソッドを確かめる', () => {
    expect(issues([target({ url: '' })])).toEqual(['targets.0.url: URL を入力してください']);
    expect(issues([target({ url: 'ftp://example.com/' })])).toEqual([
      'targets.0.url: URL は http:// か https:// で始めてください',
    ]);
    expect(issues([target({ methods: [] })])).toEqual([
      'targets.0.methods: メソッドを1つ以上選んでください',
    ]);
  });

  it('同じ URL とメソッドの組を、複数の接続先で重ねられない（同じ組は後の値で上書きされるため）', () => {
    expect(issues([target(), target({ methods: ['PUT', 'POST'] })])).toEqual([
      'targets.1.methods: 1番目の接続先と、URL と PUT の組が重なっています',
    ]);
  });

  it('キーは空にできず、1つの接続先の中で重複できない', () => {
    expect(
      issues([
        target({
          headers: [
            { id: '1', key: 'A', value: 'x' },
            { id: '2', key: ' A ', value: 'y' },
            { id: '3', key: '', value: 'z' },
          ],
        }),
      ])
    ).toEqual([
      'targets.0.headers.1.key: ヘッダーのキーが重複しています',
      'targets.0.headers.2.key: ヘッダーのキーを入力してください',
    ]);
  });

  it('ヘッダーの値は必須で、API トークンは9個まで', () => {
    expect(issues([target({ headers: [{ id: 'h', key: 'A', value: ' ' }] })])).toEqual([
      'targets.0.headers.0.value: ヘッダーの値を入力してください',
    ]);
    const tokens = (n: number) => Array.from({ length: n }, (_, i) => `t${i}`).join(',');
    expect(
      issues([target({ headers: [{ id: 'h', key: 'X-Cybozu-API-Token', value: tokens(9) }] })])
    ).toEqual([]);
    expect(
      issues([target({ headers: [{ id: 'h', key: 'X-Cybozu-API-Token', value: tokens(10) }] })])
    ).toEqual(['targets.0.headers.0.value: API トークンは9個までです']);
  });

  it('本文の値は種類に合っていること', () => {
    expect(
      issues([
        target({
          data: [
            { id: '1', key: 'a', value: 'abc', type: 'number' },
            { id: '2', key: 'b', value: '', type: 'number' },
            { id: '3', key: 'c', value: 'yes', type: 'boolean' },
            { id: '4', key: 'd', value: '', type: 'string' },
          ],
        }),
      ])
    ).toEqual([
      'targets.0.data.0.value: 10進数の数値を入力してください（大きすぎる整数は、文字として保存してください）',
      'targets.0.data.1.value: 10進数の数値を入力してください（大きすぎる整数は、文字として保存してください）',
      'targets.0.data.2.value: true か false を選んでください',
    ]);
  });
});

describe('validateTargets（ヘッダーの文字と数値の表記）', () => {
  const NUMBER_MESSAGE =
    '10進数の数値を入力してください（大きすぎる整数は、文字として保存してください）';

  it('ヘッダー名は大文字小文字を区別せずに重複を見る（本文のキーは区別する）', () => {
    expect(
      issues([
        target({
          headers: [
            { id: '1', key: 'Authorization', value: 'a' },
            { id: '2', key: 'authorization', value: 'b' },
          ],
          data: [
            { id: '3', key: 'id', value: 'x', type: 'string' },
            { id: '4', key: 'ID', value: 'y', type: 'string' },
          ],
        }),
      ])
    ).toEqual(['targets.0.headers.1.key: ヘッダーのキーが重複しています']);
  });

  it('ヘッダー名に空白などを含めず、値に改行などを含めない（混ざると保存か呼び出しが失敗するため）', () => {
    expect(
      issues([
        target({
          headers: [
            { id: '1', key: 'API Token', value: 'a' },
            { id: '2', key: 'X-Cybozu-API-Token', value: 'tok1,\ntok2' },
          ],
        }),
      ])
    ).toEqual([
      'targets.0.headers.0.key: ヘッダーのキーに使えない文字（空白など）が含まれています',
      'targets.0.headers.1.value: ヘッダーの値に改行などの制御文字は使えません',
    ]);
  });

  it.each([['12345678901234567890'], ['0x10'], ['1e3'], ['1.50'], ['Infinity']])(
    '数値 %s は、保存すると別の値や表記になるので拒否する',
    (value) => {
      expect(issues([target({ data: [{ id: 'd', key: 'n', value, type: 'number' }] })])).toEqual([
        `targets.0.data.0.value: ${NUMBER_MESSAGE}`,
      ]);
    }
  );

  it.each([['10'], ['-3'], ['1.5']])('数値 %s は受け付ける', (value) => {
    expect(issues([target({ data: [{ id: 'd', key: 'n', value, type: 'number' }] })])).toEqual([]);
  });

  it('URL が空の接続先どうしでは、メソッドの重なりを知らせない', () => {
    expect(issues([target({ url: '' }), target({ url: '' })])).toEqual([
      'targets.0.url: URL を入力してください',
      'targets.1.url: URL を入力してください',
    ]);
  });
});

describe('overlappingTargets', () => {
  it('同じメソッドで、一方の URL がもう一方の URL で始まる組を返す', () => {
    expect(
      overlappingTargets([
        target({ url: `${ORIGIN}/k/v1/`, methods: ['GET'] }),
        target({ url: `${ORIGIN}/k/v1/records.json`, methods: ['GET', 'PUT'] }),
        target({ url: `${ORIGIN}/k/v1/record.json`, methods: ['PUT'] }),
      ])
    ).toEqual([[0, 1]]);
  });
});
