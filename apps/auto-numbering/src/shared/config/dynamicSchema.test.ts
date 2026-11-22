import { describe, expect, it, vi } from 'vitest';

// 設定の定義と kintone-utils は、読み込み時にプラグイン ID と URL を読むので、読み込む前に用意する
vi.hoisted(() => {
  vi.stubGlobal('kintone', { $PLUGIN_ID: 'plugin-id' });
  vi.stubGlobal('location', { pathname: '/k/1/' });
});

const { createConfigSchema } = await import('./dynamicSchema');
const { createConfig } = await import('./persistence');
type PluginConfig = ReturnType<typeof createConfig>;
type NumberingSetting = PluginConfig['numberingSettings'][number];

const schema = createConfigSchema([
  { code: 'number', type: 'SINGLE_LINE_TEXT' },
  { code: 'serial', type: 'NUMBER' },
]);

const configWith = (overrides: (setting: NumberingSetting) => NumberingSetting): PluginConfig => {
  const config = createConfig();
  const [setting] = config.numberingSettings;
  if (!setting) throw new Error('既定の採番設定がありません');
  return {
    ...config,
    numberingSettings: [
      overrides({
        ...setting,
        resultFieldCode: 'number',
        serialConfig: { ...setting.serialConfig, serialFieldCode: 'serial' },
      }),
    ],
  };
};

/** 検証エラーの場所（path）とメッセージ */
const issues = (config: PluginConfig) => {
  const result = schema.safeParse(config);
  return result.success
    ? []
    : result.error.issues.map((issue) => ({ path: issue.path.join('.'), message: issue.message }));
};

describe('createConfigSchema', () => {
  it('アプリにあるフィールドを選んでいれば通る', () => {
    expect(issues(configWith((s) => s))).toEqual([]);
  });

  it('リセットするときに連番のフィールドが空なら、エラーにしない', () => {
    const config = configWith((s) => ({
      ...s,
      formatParts: [{ type: 'date', source: 'now', format: 'YYYY' }],
      serialConfig: { ...s.serialConfig, resetTiming: 'yearly', serialFieldCode: '' },
    }));
    expect(issues(config)).toEqual([]);
  });

  it('リセットするときに連番のフィールドが選ばれていたら、使われないと知らせる', () => {
    const config = configWith((s) => ({
      ...s,
      formatParts: [{ type: 'date', source: 'now', format: 'YYYY' }],
      serialConfig: { ...s.serialConfig, resetTiming: 'yearly' },
    }));
    expect(issues(config).map((i) => i.path)).toEqual([
      'numberingSettings.0.serialConfig.serialFieldCode',
    ]);
  });

  it('初期値が空なら、日本語のメッセージで知らせる', () => {
    const config = configWith((s) => ({
      ...s,
      // 数値の入力欄を空にすると null が入る
      serialConfig: { ...s.serialConfig, initialValue: null as unknown as number },
    }));
    expect(issues(config)).toEqual([
      {
        path: 'numberingSettings.0.serialConfig.initialValue',
        message: '初期値を数値で入力してください',
      },
    ]);
  });
});
