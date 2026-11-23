import { describe, expect, it, vi } from 'vitest';

// 設定の定義と kintone-utils は、読み込み時にプラグイン ID と URL を読むので、読み込む前に用意する
vi.hoisted(() => {
  vi.stubGlobal('kintone', {
    $PLUGIN_ID: 'plugin-id',
    api: { url: (path: string) => `https://example.cybozu.com${path}` },
  });
  vi.stubGlobal('location', { pathname: '/k/1/' });
});

const BASE = 'https://example.cybozu.com/k/v1/';

const { apiTokenSecrets, createConfig, createDefaultNumberingSetting, migrateConfig } =
  await import('./persistence');

describe('migrateConfig', () => {
  it('版の無い設定は既定値にする', () => {
    expect(migrateConfig({}).numberingSettings).toHaveLength(1);
  });

  // 既定値は採番結果のフィールドが未選択で、そのままでは保存できないので選んでおく
  const savable = () => {
    const config = createConfig();
    return {
      ...config,
      numberingSettings: config.numberingSettings.map((s) => ({ ...s, resultFieldCode: 'number' })),
    };
  };

  it('v2 の設定はそのまま返す', () => {
    const v2 = savable();
    expect(migrateConfig(structuredClone(v2))).toEqual(v2);
  });

  it('v1 の設定は v2 にし、トークンはフォームの欄に引き継ぐ（保存するとプロキシ設定に移る）', () => {
    const v2 = savable();
    const v1 = { ...v2, version: 1, common: { apiToken: '平文のトークン' } };
    // プロキシ設定にはまだ無いので、実行画面はセッションで呼ぶ
    expect(migrateConfig(v1)).toEqual({
      ...v2,
      common: { apiToken: '平文のトークン', useApiToken: false },
    });
  });

  it('形の合わない設定は例外を投げる（呼び出し側が既定値に戻して知らせる）', () => {
    expect(() => migrateConfig({ version: 1, numberingSettings: 'broken' })).toThrow();
  });
});

describe('既定値', () => {
  it('最初の採番設定は連番だけ、追加する採番設定はテキストのパーツを1つ持つ', () => {
    expect(createConfig().numberingSettings[0]?.formatParts).toEqual([]);
    expect(createDefaultNumberingSetting().formatParts).toEqual([{ type: 'text', value: '' }]);
  });
});

describe('apiTokenSecrets', () => {
  const withToken = (apiToken: string) => ({
    ...createConfig(),
    common: { apiToken, useApiToken: false },
  });

  it('トークンは前後の空白を除いて、採番で使う REST API だけのプロキシ設定にする', () => {
    const headers = { 'X-Cybozu-API-Token': 'token' };
    expect(apiTokenSecrets.toEntries(withToken('  token\n'))).toEqual([
      { url: `${BASE}records.json`, method: 'GET', headers, data: {} },
      { url: `${BASE}record.json`, method: 'GET', headers, data: {} },
      { url: `${BASE}record.json`, method: 'PUT', headers, data: {} },
    ]);
  });

  it('トークンが空（空白だけを含む）なら、プロキシ設定は作らない', () => {
    expect(apiTokenSecrets.toEntries(withToken('  '))).toEqual([]);
  });

  it('strip はトークンを空にし、トークンがあったかを useApiToken に残す', () => {
    expect(apiTokenSecrets.strip(withToken('token')).common).toEqual({
      apiToken: '',
      useApiToken: true,
    });
    expect(apiTokenSecrets.strip(withToken(' ')).common).toEqual({
      apiToken: '',
      useApiToken: false,
    });
  });

  it('fill は保存済みのトークンを読んで戻す', () => {
    const read = vi.fn(() => ({ headers: { 'X-Cybozu-API-Token': 'saved' }, data: {} }));
    const stripped = { ...createConfig(), common: { apiToken: '', useApiToken: true } };
    expect(apiTokenSecrets.fill(stripped, read).common.apiToken).toBe('saved');
    expect(read).toHaveBeenCalledWith({ url: `${BASE}records.json`, method: 'GET' });
  });

  it('トークンの無いファイルをインポートしても、保存済みのトークンを残す（保存で消さないため）', () => {
    const read = () => ({ headers: { 'X-Cybozu-API-Token': 'saved' }, data: {} });
    // useApiToken が false のファイル（v1 や、トークンの無いアプリから書き出したもの）
    expect(apiTokenSecrets.fill(createConfig(), read).common.apiToken).toBe('saved');
  });

  it('保存済みのトークンが無ければ、設定の値（v1 から引き継いだトークン）を残す', () => {
    expect(apiTokenSecrets.fill(withToken('v1 のトークン'), () => null).common.apiToken).toBe(
      'v1 のトークン'
    );
    const stripped = { ...createConfig(), common: { apiToken: '', useApiToken: true } };
    expect(apiTokenSecrets.fill(stripped, () => null).common.apiToken).toBe('');
  });
});
