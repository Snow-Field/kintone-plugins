import { describe, expect, it, vi } from 'vitest';

// 設定の定義と kintone-utils は、読み込み時にプラグイン ID と URL を読むので、読み込む前に用意する
vi.hoisted(() => {
  vi.stubGlobal('kintone', { $PLUGIN_ID: 'plugin-id' });
  vi.stubGlobal('location', { pathname: '/k/1/' });
});

const { createConfig, migrateConfig } = await import('./persistence');

describe('migrateConfig', () => {
  it('版も条件も無い設定は既定値にする', () => {
    const migrated = migrateConfig({});
    expect(migrated).toEqual({ ...createConfig(), conditions: [expect.any(Object)] });
    expect(migrated.version).toBe(2);
  });

  it('v1 の設定は、単位を空で補って v2 にする', () => {
    const v1 = {
      version: 1,
      conditions: [{ id: 'a', srcFieldCode: 'birthday', destFieldCode: 'age' }],
      advanced: { isUpdateOnSave: true },
    };
    expect(migrateConfig(v1)).toEqual({
      version: 2,
      conditions: [{ id: 'a', srcFieldCode: 'birthday', destFieldCode: 'age', unit: '' }],
      advanced: { isUpdateOnSave: true },
    });
  });

  it('v1 に単位が入っていれば残す', () => {
    const v1 = {
      version: 1,
      conditions: [{ id: 'a', srcFieldCode: 'birthday', destFieldCode: 'age', unit: '歳' }],
      advanced: { isUpdateOnSave: false },
    };
    expect(migrateConfig(v1).conditions[0]?.unit).toBe('歳');
  });

  it('版を持つ前の設定でも、条件があれば v1 として移す', () => {
    const legacy = {
      conditions: [{ id: 'a', srcFieldCode: 'birthday', destFieldCode: 'age' }],
      advanced: { isUpdateOnSave: false },
    };
    expect(migrateConfig(legacy)).toMatchObject({
      version: 2,
      conditions: [{ id: 'a', unit: '' }],
    });
  });

  it('v2 の設定はそのまま返す', () => {
    const v2 = {
      version: 2,
      conditions: [{ id: 'a', srcFieldCode: 'birthday', destFieldCode: 'age', unit: '歳' }],
      advanced: { isUpdateOnSave: false },
    };
    expect(migrateConfig(v2)).toEqual(v2);
  });

  it('形の合わない設定は例外を投げる（呼び出し側が既定値に戻して知らせる）', () => {
    expect(() => migrateConfig({ version: 1, conditions: 'broken' })).toThrow();
  });
});
