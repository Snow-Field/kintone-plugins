import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { definePluginConfig, SaveTimeoutError, waitForSave } from './pluginConfig';

const schema = z.object({ version: z.literal(2), message: z.string() });
type Config = z.infer<typeof schema>;

const createDefault = (): Config => ({ version: 2, message: '既定値' });

/** v1 は message の代わりに text を持っていた */
const migrate = (parsed: Record<string, unknown>): Config =>
  parsed.version === 1 ? { version: 2, message: String(parsed.text) } : (parsed as Config);

const getConfig = vi.fn<(pluginId: string) => Record<string, string>>();
const setConfig = vi.fn();

/** kintone をモックしてから定義を作る（定義を作った時点のプラグイン ID を使うため） */
const setup = (
  saved: Record<string, string>,
  options: { migrate?: (parsed: Record<string, unknown>) => Config } = { migrate }
) => {
  getConfig.mockReturnValue(saved);
  vi.stubGlobal('kintone', {
    $PLUGIN_ID: 'plugin-id',
    plugin: { app: { getConfig, setConfig } },
  });
  return definePluginConfig<Config>({
    name: 'テスト',
    schema,
    createDefault,
    migrate: options.migrate,
    createValidationSchema: () => schema,
  });
};

describe('definePluginConfig', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    getConfig.mockReset();
    setConfig.mockReset();
  });

  describe('load', () => {
    it('保存済みの値を JSON として読み、スキーマで検証して返す', () => {
      const pluginConfig = setup({ version: '2', message: '"保存済み"' });
      expect(pluginConfig.load()).toEqual({
        config: { version: 2, message: '保存済み' },
        error: null,
      });
    });

    it('定義を作った時点のプラグイン ID で読む（後から $PLUGIN_ID が変わっても影響されない）', () => {
      const pluginConfig = setup({});
      // 別のプラグインのスクリプトが読み込まれると $PLUGIN_ID は変わる
      vi.stubGlobal('kintone', { ...kintone, $PLUGIN_ID: 'other-plugin-id' });
      pluginConfig.load();
      expect(getConfig).toHaveBeenCalledWith('plugin-id');
    });

    it('未保存なら既定値を返し、失敗として扱わない', () => {
      const pluginConfig = setup({});
      expect(pluginConfig.load()).toEqual({ config: createDefault(), error: null });
    });

    it('旧版の設定は移行してから検証する', () => {
      const pluginConfig = setup({ version: '1', text: '"旧版"' });
      expect(pluginConfig.load().config).toEqual({ version: 2, message: '旧版' });
    });

    it('JSON として読めなければ、既定値と原因を返す', () => {
      const pluginConfig = setup({ version: '2', message: '壊れた値' });
      const result = pluginConfig.load();
      expect(result.config).toEqual(createDefault());
      expect(result.error).toBeInstanceOf(SyntaxError);
    });

    it('スキーマに合わなければ、既定値と原因を返す', () => {
      const pluginConfig = setup({ version: '2', message: '123' });
      const result = pluginConfig.load();
      expect(result.config).toEqual(createDefault());
      expect(result.error).toBeInstanceOf(z.ZodError);
    });

    it('Error 以外の値が投げられても、失敗として Error に包んで返す', () => {
      const pluginConfig = setup(
        { version: '1', text: '"旧版"' },
        {
          migrate: () => {
            // Error 以外が投げられた場合の確認
            throw undefined;
          },
        }
      );
      const result = pluginConfig.load();
      expect(result.config).toEqual(createDefault());
      expect(result.error).toBeInstanceOf(Error);
    });
  });

  describe('restore', () => {
    it('成功したら保存済みの値を返す', () => {
      const pluginConfig = setup({ version: '2', message: '"保存済み"' });
      expect(pluginConfig.restore()).toEqual({ version: 2, message: '保存済み' });
      expect(console.error).not.toHaveBeenCalled();
    });

    it('失敗したら既定値で動き、エラーをコンソールに出す', () => {
      const pluginConfig = setup({ version: '2', message: '123' });
      expect(pluginConfig.restore()).toEqual(createDefault());
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('parse', () => {
    it('最新版の設定はそのまま検証して返す', () => {
      const pluginConfig = setup({});
      expect(pluginConfig.parse({ version: 2, message: '最新' })).toEqual({
        success: true,
        data: { version: 2, message: '最新' },
      });
    });

    it('旧版の設定は移行してから検証する', () => {
      const pluginConfig = setup({});
      expect(pluginConfig.parse({ version: 1, text: '旧版' })).toEqual({
        success: true,
        data: { version: 2, message: '旧版' },
      });
    });

    it.each([
      ['version が無い', { message: '既定値になってしまう' }],
      ['version が数値でない', { version: '2', message: '文字列の版' }],
      ['オブジェクトでない', ['配列']],
      ['null', null],
    ])('%s ものは拒否する', (_, data) => {
      const pluginConfig = setup({});
      const result = pluginConfig.parse(data);
      expect(result.success).toBe(false);
    });

    it('スキーマに合わないものは拒否する', () => {
      const pluginConfig = setup({});
      const result = pluginConfig.parse({ version: 2, message: 123 });
      expect(result).toMatchObject({ success: false });
      expect(!result.success && result.error).toBeInstanceOf(z.ZodError);
    });
  });

  describe('store', () => {
    it('各キーの値を JSON 文字列にして保存する', () => {
      const pluginConfig = setup({});
      const callback = vi.fn();
      pluginConfig.store({ version: 2, message: '保存' }, callback);
      expect(setConfig).toHaveBeenCalledWith({ version: '2', message: '"保存"' }, callback);
    });
  });
});

describe('definePluginConfig の secrets', () => {
  const secretSchema = z.object({
    version: z.literal(1),
    token: z.string(),
    hasToken: z.boolean(),
  });
  type SecretConfig = z.infer<typeof secretSchema>;
  const URL = 'https://example.cybozu.com/k/v1/';

  const getProxyConfig = vi.fn();
  const setProxyConfig = vi.fn();

  const setupSecrets = (saved: Record<string, string>) => {
    getConfig.mockReturnValue(saved);
    setProxyConfig.mockImplementation((_u, _m, _h, _d, callback: () => void) => callback());
    vi.stubGlobal('kintone', {
      $PLUGIN_ID: 'plugin-id',
      plugin: { app: { getConfig, setConfig, getProxyConfig, setProxyConfig } },
    });
    return definePluginConfig<SecretConfig>({
      name: 'テスト',
      schema: secretSchema,
      createDefault: () => ({ version: 1, token: '', hasToken: false }),
      createValidationSchema: () => secretSchema,
      secrets: {
        toEntries: (c) =>
          c.token ? [{ url: URL, method: 'GET', headers: { token: c.token }, data: {} }] : [],
        strip: (c) => ({ ...c, token: '', hasToken: c.token !== '' }),
        fill: (c, read) =>
          c.hasToken ? { ...c, token: read({ url: URL, method: 'GET' })?.headers.token ?? '' } : c,
      },
    });
  };

  afterEach(() => {
    vi.unstubAllGlobals();
    getConfig.mockReset();
    setConfig.mockReset();
    getProxyConfig.mockReset();
    setProxyConfig.mockReset();
  });

  it('load は保存済みの秘密を埋め、予約キーは設定に含めない', () => {
    const pluginConfig = setupSecrets({
      version: '1',
      token: '""',
      hasToken: 'true',
      __proxyKeys: JSON.stringify([{ url: URL, method: 'GET' }]),
    });
    getProxyConfig.mockReturnValue({ headers: { token: '秘密' }, data: {} });
    expect(pluginConfig.load()).toEqual({
      config: { version: 1, token: '秘密', hasToken: true },
      error: null,
    });
  });

  it('restore は秘密を読まない（実行画面では getProxyConfig が使えないため）', () => {
    const pluginConfig = setupSecrets({ version: '1', token: '""', hasToken: 'true' });
    expect(pluginConfig.restore()).toEqual({ version: 1, token: '', hasToken: true });
    expect(getProxyConfig).not.toHaveBeenCalled();
  });

  it('parse（インポート）は保存済みの秘密を埋める', () => {
    const pluginConfig = setupSecrets({});
    getProxyConfig.mockReturnValue({ headers: { token: '秘密' }, data: {} });
    expect(pluginConfig.parse({ version: 1, token: '', hasToken: true })).toEqual({
      success: true,
      data: { version: 1, token: '秘密', hasToken: true },
    });
  });

  it('秘密を読めなければ、既定値と原因を返す', () => {
    const pluginConfig = setupSecrets({ version: '1', token: '""', hasToken: 'true' });
    getProxyConfig.mockImplementation(() => {
      throw new Error('読めません');
    });
    const result = pluginConfig.load();
    expect(result.config).toEqual({ version: 1, token: '', hasToken: false });
    expect(result.error?.message).toBe('読めません');
  });

  it('store は秘密をプロキシ設定に保存し、消えた組を無効にしてから、秘密を除いて setConfig に保存する', async () => {
    const pluginConfig = setupSecrets({
      __proxyKeys: JSON.stringify([{ url: `${URL}old/`, method: 'PUT' }]),
    });
    const callback = vi.fn();
    await pluginConfig.store({ version: 1, token: '秘密', hasToken: false }, callback);

    expect(setProxyConfig.mock.calls.map((c) => c.slice(0, 4))).toEqual([
      [URL, 'GET', { token: '秘密' }, {}],
      [`${URL}old/`, 'PUT', {}, {}],
    ]);
    expect(setConfig).toHaveBeenCalledWith(
      {
        version: '1',
        token: '""',
        hasToken: 'true',
        __proxyKeys: JSON.stringify([{ url: URL, method: 'GET' }]),
      },
      callback
    );
    // setConfig の値に秘密が入っていない
    expect(JSON.stringify(setConfig.mock.calls)).not.toContain('秘密');
  });

  it('プロキシ設定の保存に失敗したら、setConfig は呼ばずに失敗する', async () => {
    const pluginConfig = setupSecrets({});
    setProxyConfig.mockImplementation(() => {
      throw new Error('保存できません');
    });
    await expect(
      pluginConfig.store({ version: 1, token: '秘密', hasToken: false }, vi.fn())
    ).rejects.toThrow('保存できません');
    expect(setConfig).not.toHaveBeenCalled();
  });

  it('toExport は秘密を除く', () => {
    const pluginConfig = setupSecrets({});
    expect(pluginConfig.toExport({ version: 1, token: '秘密', hasToken: false })).toEqual({
      version: 1,
      token: '',
      hasToken: true,
    });
  });
});

describe('waitForSave', () => {
  it('保存のコールバックが呼ばれてから完了する', async () => {
    let complete: (() => void) | undefined;
    const save = vi.fn((_: unknown, callback: () => void) => {
      complete = callback;
    });
    let done = false;
    const promise = waitForSave(save, { a: 1 }).then(() => {
      done = true;
    });

    await Promise.resolve();
    expect(done).toBe(false);

    complete?.();
    await promise;
    expect(done).toBe(true);
    expect(save).toHaveBeenCalledWith({ a: 1 }, expect.any(Function));
  });

  it('slowAfterMs を過ぎたら onSlow を呼び、そのあとに届いた完了も成功として扱う', async () => {
    vi.useFakeTimers();
    try {
      let complete: (() => void) | undefined;
      const onSlow = vi.fn();
      const promise = waitForSave(
        (_, callback: () => void) => {
          complete = callback;
        },
        {},
        { slowAfterMs: 1000, onSlow, timeoutMs: 5000 }
      );

      vi.advanceTimersByTime(1000);
      expect(onSlow).toHaveBeenCalledTimes(1);

      complete?.();
      await expect(promise).resolves.toBeUndefined();
      expect(onSlow).toHaveBeenCalledTimes(1);
      expect(vi.getTimerCount()).toBe(0);
    } finally {
      vi.useRealTimers();
    }
  });

  it('timeoutMs までに完了しなければ SaveTimeoutError で失敗する（保存中のまま止まらない）', async () => {
    vi.useFakeTimers();
    try {
      const promise = waitForSave(() => undefined, {}, { slowAfterMs: 1000, timeoutMs: 5000 });
      vi.advanceTimersByTime(5000);
      await expect(promise).rejects.toBeInstanceOf(SaveTimeoutError);
      await expect(promise).rejects.toThrow('5 秒以内に確認できませんでした');
    } finally {
      vi.useRealTimers();
    }
  });

  it('完了した後は onSlow を呼ばず、タイムアウトもしない', async () => {
    vi.useFakeTimers();
    try {
      const onSlow = vi.fn();
      const promise = waitForSave((_, callback) => callback(), {}, { slowAfterMs: 1000, onSlow });
      await expect(promise).resolves.toBeUndefined();
      expect(vi.getTimerCount()).toBe(0);
      expect(onSlow).not.toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });

  it('保存の処理が例外を投げたら失敗する', async () => {
    const save = () => {
      throw new Error('保存できません');
    };
    await expect(waitForSave(save, {})).rejects.toThrow('保存できません');
  });

  it('非同期の保存が reject したら失敗する（タイムアウトまで待たない）', async () => {
    const save = () => Promise.reject(new Error('プロキシ設定を保存できません'));
    await expect(waitForSave(save, {})).rejects.toThrow('プロキシ設定を保存できません');
  });
});
