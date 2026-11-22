import { describe, expect, it, vi } from 'vitest';

// 設定の定義と kintone-utils は、読み込み時にプラグイン ID と URL を読むので、読み込む前に用意する
vi.hoisted(() => {
  vi.stubGlobal('kintone', { $PLUGIN_ID: 'plugin-id' });
  vi.stubGlobal('location', { pathname: '/k/1/' });
});

const { createConfig, createDefaultRule, migrateConfig } = await import('./persistence');

describe('migrateConfig', () => {
  it('版の無い設定は既定値にする', () => {
    const migrated = migrateConfig({ visibilityRules: 'broken' });
    expect(migrated.version).toBe(1);
    expect(migrated.visibilityRules).toHaveLength(1);
  });

  it('v1 の設定はそのまま返す', () => {
    const v1 = createConfig();
    expect(migrateConfig(structuredClone(v1))).toEqual(v1);
  });

  it('形の合わない設定は例外を投げる（呼び出し側が既定値に戻して知らせる）', () => {
    expect(() => migrateConfig({ version: 1, visibilityRules: 'broken' })).toThrow();
  });
});

describe('createDefaultRule', () => {
  it('毎回ちがう ID を付ける', () => {
    expect(createDefaultRule().id).not.toBe(createDefaultRule().id);
  });
});
