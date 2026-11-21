import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { definePluginConfig, waitForSave } from './pluginConfig';

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
            // eslint-disable-next-line no-throw-literal -- Error 以外が投げられた場合の確認
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

  it('決められた時間までに完了しなければ失敗する（保存中のまま止まらない）', async () => {
    vi.useFakeTimers();
    try {
      const promise = waitForSave(() => undefined, {}, 1000);
      vi.advanceTimersByTime(1000);
      await expect(promise).rejects.toThrow('1 秒以内に確認できませんでした');
    } finally {
      vi.useRealTimers();
    }
  });

  it('完了した後はタイムアウトしない', async () => {
    vi.useFakeTimers();
    try {
      const promise = waitForSave((_, callback) => callback(), {}, 1000);
      await expect(promise).resolves.toBeUndefined();
      expect(vi.getTimerCount()).toBe(0);
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
});
