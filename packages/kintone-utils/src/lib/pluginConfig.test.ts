import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { definePluginConfig } from './pluginConfig';

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

  describe('store', () => {
    it('各キーの値を JSON 文字列にして保存する', () => {
      const pluginConfig = setup({});
      const callback = vi.fn();
      pluginConfig.store({ version: 2, message: '保存' }, callback);
      expect(setConfig).toHaveBeenCalledWith({ version: '2', message: '"保存"' }, callback);
    });
  });
});
