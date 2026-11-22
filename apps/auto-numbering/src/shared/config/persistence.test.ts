import { describe, expect, it, vi } from 'vitest';

// 設定の定義と kintone-utils は、読み込み時にプラグイン ID と URL を読むので、読み込む前に用意する
vi.hoisted(() => {
  vi.stubGlobal('kintone', { $PLUGIN_ID: 'plugin-id' });
  vi.stubGlobal('location', { pathname: '/k/1/' });
});

const { createConfig, createDefaultNumberingSetting, migrateConfig } = await import(
  './persistence'
);

describe('migrateConfig', () => {
  it('版の無い設定は既定値にする', () => {
    expect(migrateConfig({}).numberingSettings).toHaveLength(1);
  });

  it('v1 の設定はそのまま返す', () => {
    // 既定値は採番結果のフィールドが未選択で、そのままでは保存できないので選んでおく
    const config = createConfig();
    const v1 = {
      ...config,
      numberingSettings: config.numberingSettings.map((s) => ({ ...s, resultFieldCode: 'number' })),
    };
    expect(migrateConfig(structuredClone(v1))).toEqual(v1);
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
