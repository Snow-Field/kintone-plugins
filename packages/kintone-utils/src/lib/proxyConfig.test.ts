import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  type ProxyEntry,
  parseProxyKeys,
  readProxySettings,
  requestViaProxy,
  staleProxyKeys,
  storeProxyEntries,
} from './proxyConfig';

const BASE = 'https://example.cybozu.com/k/v1/';

const entry = (method: ProxyEntry['method'], url = BASE): ProxyEntry => ({
  url,
  method,
  headers: { 'X-Cybozu-API-Token': 'token' },
  data: {},
});

const setProxyConfig = vi.fn();
const getProxyConfig = vi.fn();
const proxy = vi.fn();

beforeEach(() => {
  // コールバックを呼んで、保存の完了を知らせる
  setProxyConfig.mockImplementation((_u, _m, _h, _d, callback: () => void) => callback());
  vi.stubGlobal('kintone', { plugin: { app: { setProxyConfig, getProxyConfig, proxy } } });
});

afterEach(() => {
  vi.unstubAllGlobals();
  setProxyConfig.mockReset();
  getProxyConfig.mockReset();
  proxy.mockReset();
});

describe('staleProxyKeys', () => {
  it('前回あって今回無いキーだけを返す（URL とメソッドの両方で比べる）', () => {
    const previous = [
      { url: BASE, method: 'GET' as const },
      { url: BASE, method: 'PUT' as const },
      { url: 'https://api.example.com/', method: 'GET' as const },
    ];
    expect(staleProxyKeys([entry('GET')], previous)).toEqual([
      { url: BASE, method: 'PUT' },
      { url: 'https://api.example.com/', method: 'GET' },
    ]);
  });

  it('前回が空なら何も返さない', () => {
    expect(staleProxyKeys([entry('GET')], [])).toEqual([]);
  });
});

describe('parseProxyKeys', () => {
  it('保存した JSON からキーを読む', () => {
    expect(parseProxyKeys(JSON.stringify([{ url: BASE, method: 'GET' }]))).toEqual([
      { url: BASE, method: 'GET' },
    ]);
  });

  it.each([
    ['未保存', undefined],
    ['JSON でない', '壊れた値'],
    ['配列でない', '{"url":"x"}'],
  ])('%s なら空として扱う', (_, raw) => {
    expect(parseProxyKeys(raw)).toEqual([]);
  });

  it('形の合わない要素は除く', () => {
    expect(
      parseProxyKeys(JSON.stringify([{ url: BASE }, null, { url: BASE, method: 'PUT' }]))
    ).toEqual([{ url: BASE, method: 'PUT' }]);
  });
});

describe('storeProxyEntries', () => {
  it('今回の組を保存してから、消えた組を {} で上書きし、今回のキーを返す', async () => {
    const keys = await storeProxyEntries([entry('GET')], [{ url: BASE, method: 'PUT' }]);
    expect(setProxyConfig.mock.calls.map((c) => c.slice(0, 4))).toEqual([
      [BASE, 'GET', { 'X-Cybozu-API-Token': 'token' }, {}],
      [BASE, 'PUT', {}, {}],
    ]);
    expect(keys).toEqual([{ url: BASE, method: 'GET' }]);
  });

  it('前の保存が終わるまで、次の保存を始めない', async () => {
    const callbacks: (() => void)[] = [];
    setProxyConfig.mockImplementation((_u, _m, _h, _d, callback: () => void) => {
      callbacks.push(callback);
    });
    const promise = storeProxyEntries([entry('GET'), entry('PUT')], []);
    await Promise.resolve();
    expect(setProxyConfig).toHaveBeenCalledTimes(1);
    callbacks[0]?.();
    await vi.waitFor(() => expect(setProxyConfig).toHaveBeenCalledTimes(2));
    callbacks[1]?.();
    await expect(promise).resolves.toHaveLength(2);
  });

  it('同じキーの組が2つあれば、何も保存せずに失敗する', async () => {
    await expect(storeProxyEntries([entry('GET'), entry('GET')], [])).rejects.toThrow('重複');
    expect(setProxyConfig).not.toHaveBeenCalled();
  });

  it('保存の途中で例外が出たら失敗する', async () => {
    setProxyConfig.mockImplementation(() => {
      throw new Error('保存できません');
    });
    await expect(storeProxyEntries([entry('GET')], [])).rejects.toThrow('保存できません');
  });
});

describe('readProxySettings', () => {
  it('保存済みのヘッダーと本文を返す', () => {
    getProxyConfig.mockReturnValue({ headers: { a: '1' }, data: {} });
    expect(readProxySettings({ url: BASE, method: 'GET' })).toEqual({
      headers: { a: '1' },
      data: {},
    });
    expect(getProxyConfig).toHaveBeenCalledWith(BASE, 'GET');
  });

  it.each([
    ['未保存（null）', null],
    ['{} で無効にした組', { headers: {}, data: {} }],
  ])('%s は null を返す', (_, saved) => {
    getProxyConfig.mockReturnValue(saved);
    expect(readProxySettings({ url: BASE, method: 'GET' })).toBeNull();
  });
});

describe('requestViaProxy', () => {
  it('kintone の応答を本文・ステータス・ヘッダーに分けて返す（4xx でも失敗にしない）', async () => {
    proxy.mockResolvedValue(['{"code":"CB_AU01"}', 401, { Server: 'nginx' }]);
    await expect(
      requestViaProxy('plugin-id', { url: `${BASE}records.json`, method: 'GET' }, {}, {})
    ).resolves.toEqual({ body: '{"code":"CB_AU01"}', status: 401, headers: { Server: 'nginx' } });
    expect(proxy).toHaveBeenCalledWith('plugin-id', `${BASE}records.json`, 'GET', {}, {});
  });

  it('応答の形が想定と違えば失敗する', async () => {
    proxy.mockResolvedValue(undefined);
    await expect(
      requestViaProxy('plugin-id', { url: BASE, method: 'GET' }, {}, {})
    ).rejects.toThrow('応答の形');
  });
});
