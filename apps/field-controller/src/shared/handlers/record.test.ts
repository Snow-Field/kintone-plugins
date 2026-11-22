import { afterEach, describe, expect, it, vi } from 'vitest';

const setFieldShown = vi.fn();
const mobileSetFieldShown = vi.fn();

// kintone-utils は読み込み時にプラグイン ID と URL を読むので、読み込む前に用意する
vi.hoisted(() => {
  vi.stubGlobal('location', { pathname: '/k/1/' });
});
vi.stubGlobal('kintone', {
  $PLUGIN_ID: 'plugin-id',
  app: { getId: () => 1, record: { setFieldShown } },
  mobile: { app: { getId: () => 1, record: { setFieldShown: mobileSetFieldShown } } },
});

const { applyFieldControls } = await import('./record');
const { createConfig, createDefaultRule } = await import('@/shared/config');
type PluginConfig = ReturnType<typeof createConfig>;

/** 条件の無いルール（トリガーが合えば必ず適用する） */
const rule = <T extends string>(triggers: T[], targetFields: string[]) => {
  const base = createDefaultRule();
  return { ...base, block: { ...base.block, triggers }, targetFields };
};

describe('applyFieldControls', () => {
  afterEach(() => {
    setFieldShown.mockReset();
    mobileSetFieldShown.mockReset();
  });

  it('編集不可のルールに合えば、対象フィールドを編集不可にする', () => {
    const config: PluginConfig = {
      ...createConfig(),
      disableRules: [rule(['app.record.edit.show'], ['name', 'missing'])],
    };
    const event = {
      type: 'app.record.edit.show' as const,
      appId: 1,
      recordId: 1,
      record: { name: { type: 'SINGLE_LINE_TEXT' as const, value: '' } },
    };

    applyFieldControls(event, config);

    expect(event.record.name).toMatchObject({ disabled: true });
  });

  it('非表示のルールに合えば、PC とモバイルでそれぞれの API で非表示にする', () => {
    const config = {
      ...createConfig(),
      visibilityRules: [
        rule(['app.record.detail.show', 'mobile.app.record.detail.show'], ['memo']),
      ],
    } as ReturnType<typeof createConfig>;

    applyFieldControls(
      { type: 'app.record.detail.show', appId: 1, recordId: 1, record: {} },
      config
    );
    applyFieldControls(
      { type: 'mobile.app.record.detail.show', appId: 1, recordId: 1, record: {} },
      config
    );

    expect(setFieldShown).toHaveBeenCalledWith('memo', false);
    expect(mobileSetFieldShown).toHaveBeenCalledWith('memo', false);
  });

  it('無効なルールは適用しない', () => {
    const config: PluginConfig = {
      ...createConfig(),
      visibilityRules: [{ ...rule(['app.record.detail.show'], ['memo']), enabled: false }],
    };

    applyFieldControls(
      { type: 'app.record.detail.show', appId: 1, recordId: 1, record: {} },
      config
    );

    expect(setFieldShown).not.toHaveBeenCalled();
  });
});
