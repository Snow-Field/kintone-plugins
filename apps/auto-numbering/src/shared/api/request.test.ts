import { beforeEach, describe, expect, it, vi } from 'vitest';

const BASE = 'https://example.cybozu.com/k/guest/3/v1/';

const { api, proxy } = vi.hoisted(() => {
  const api = vi.fn();
  const proxy = vi.fn();
  vi.stubGlobal('kintone', {
    $PLUGIN_ID: 'plugin-id',
    // ゲストスペースのアプリとして URL を作る
    api: Object.assign(api, {
      url: (path: string) => `https://example.cybozu.com/k/guest/3${path.slice(2)}`,
    }),
    plugin: { app: { proxy } },
  });
  // kintone-utils は読み込み時に URL を読む
  vi.stubGlobal('location', { pathname: '/k/guest/3/1/' });
  return { api, proxy };
});

const { apiTokenEntries, apiTokenKeys, apiTokenReadKey, requestApi } = await import('./request');

describe('apiTokenEntries・apiTokenReadKey', () => {
  it('ゲストスペースでは /k/guest/{スペースID}/v1/ の、採番で使う API にトークンを保存する', () => {
    expect(apiTokenEntries('token').map(({ url, method }) => [method, url])).toEqual([
      ['GET', `${BASE}records.json`],
      ['GET', `${BASE}record.json`],
      ['PUT', `${BASE}record.json`],
    ]);
    expect(apiTokenReadKey()).toEqual({ url: `${BASE}records.json`, method: 'GET' });
    // 保存しうるキーは、保存する組と同じ
    expect(apiTokenKeys()).toEqual(
      apiTokenEntries('token').map(({ url, method }) => ({ url, method }))
    );
  });
});

describe('requestApi', () => {
  beforeEach(() => {
    api.mockReset();
    proxy.mockReset();
  });

  it('トークンを使わなければ、セッションで kintone.api を呼ぶ', async () => {
    api.mockResolvedValue({ record: {} });
    await requestApi('record.json', 'GET', { app: 1, id: 2 }, { useApiToken: false });
    expect(api).toHaveBeenCalledWith(`${BASE}record.json`, 'GET', { app: 1, id: 2 });
    expect(proxy).not.toHaveBeenCalled();
  });

  it('kintone.api の失敗（エラーのオブジェクト）は Error にして投げる', async () => {
    api.mockRejectedValue({ code: 'CB_NO02', message: '権限がありません' });
    await expect(
      requestApi('record.json', 'GET', { app: 1, id: 2 }, { useApiToken: false })
    ).rejects.toThrow('（CB_NO02）: 権限がありません');
  });

  it('トークンを使うなら、GET はパラメーターをクエリにして proxy で呼ぶ（トークンは渡さない）', async () => {
    proxy.mockResolvedValue(['{"records":[]}', 200, {}]);
    await expect(
      requestApi('records.json', 'GET', { app: 1, fields: ['a'] }, { useApiToken: true })
    ).resolves.toEqual({ records: [] });
    expect(proxy).toHaveBeenCalledWith(
      'plugin-id',
      `${BASE}records.json?app=1&${encodeURIComponent('fields[0]')}=a`,
      'GET',
      {},
      {}
    );
  });

  it('トークンを使うなら、PUT は JSON の本文にして proxy で呼ぶ', async () => {
    proxy.mockResolvedValue(['{"revision":"6"}', 200, {}]);
    const params = { app: 1, id: 2, record: { a: { value: 'x' } }, revision: '5' };
    await requestApi('record.json', 'PUT', params, { useApiToken: true });
    expect(proxy).toHaveBeenCalledWith(
      'plugin-id',
      `${BASE}record.json`,
      'PUT',
      { 'Content-Type': 'application/json' },
      JSON.stringify(params)
    );
  });

  it('proxy が 200 以外を返したら失敗にする（proxy 自体は失敗にしないため）', async () => {
    proxy.mockResolvedValue(['{"code":"CB_AU01","message":"ログインしてください。"}', 401, {}]);
    await expect(
      requestApi('records.json', 'GET', { app: 1 }, { useApiToken: true })
    ).rejects.toThrow('（401 CB_AU01）: ログインしてください。');
  });
});
