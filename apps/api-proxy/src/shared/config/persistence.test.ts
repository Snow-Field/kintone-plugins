import { describe, expect, it, vi } from 'vitest';

// 設定の定義と kintone-utils は、読み込み時にプラグイン ID と URL を読むので、読み込む前に用意する
vi.hoisted(() => {
  vi.stubGlobal('kintone', { $PLUGIN_ID: 'plugin-id' });
  vi.stubGlobal('location', { pathname: '/k/1/' });
});

const { migrateConfig } = await import('./persistence');

const v1Target = {
  id: 't',
  url: 'https://example.com/',
  methods: ['GET'],
  headers: [],
  data: [],
  memo: '',
};

describe('migrateConfig', () => {
  it('版の無い設定は既定値にする', () => {
    expect(migrateConfig({})).toEqual({ version: 2, targets: [] });
  });

  it('v1 の接続先は、すべて有効にして v2 にする', () => {
    expect(migrateConfig({ version: 1, targets: [v1Target] })).toEqual({
      version: 2,
      targets: [{ ...v1Target, enabled: true }],
    });
  });

  it('v2 はそのまま検証して返す', () => {
    const v2 = { version: 2, targets: [{ ...v1Target, enabled: false }] };
    expect(migrateConfig(structuredClone(v2))).toEqual(v2);
  });

  it('接続先の id が重なっていれば振り直す（無効な接続先の保存先が重ならないように）', () => {
    const t = { ...v1Target, enabled: false };
    const { targets } = migrateConfig({ version: 2, targets: [t, t] });
    expect(targets[0]?.id).toBe('t');
    expect(targets[1]?.id).not.toBe('t');
  });
});
