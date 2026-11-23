import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PluginConfig } from '@/shared/config';
import type { KintoneEvent } from '@/shared/types/kintone';

const { executeNumbering } = vi.hoisted(() => ({ executeNumbering: vi.fn() }));
vi.mock('./numbering', () => ({ executeNumbering }));

const { lockResultFields, numberRecord } = await import('./record');

const setting = (resultFieldCode: string, enabled = true) => ({
  id: resultFieldCode,
  enabled,
  resultFieldCode,
  formatParts: [],
  connector: '-' as const,
  serialConfig: { initialValue: 1, digit: 5, resetTiming: 'none' as const, serialFieldCode: 's' },
});

const config = (...settings: ReturnType<typeof setting>[]): PluginConfig => ({
  version: 2,
  numberingSettings: settings,
  common: { apiToken: '', useApiToken: true },
});

const showEvent = (type: 'app.record.create.show' | 'mobile.app.record.edit.show') => ({
  type,
  appId: 1,
  recordId: undefined,
  record: {
    on: { type: 'SINGLE_LINE_TEXT' as const, value: 'コピー元の番号' },
    off: { type: 'SINGLE_LINE_TEXT' as const, value: 'コピー元の番号' },
  },
});

describe('lockResultFields', () => {
  it('有効な設定の採番結果のフィールドだけを編集不可にし、作成画面では値を消す', () => {
    const event = lockResultFields(
      showEvent('app.record.create.show'),
      config(setting('on'), setting('off', false))
    );
    expect(event.record.on).toMatchObject({ disabled: true, value: '' });
    expect(event.record.off).toEqual({ type: 'SINGLE_LINE_TEXT', value: 'コピー元の番号' });
  });

  it('編集画面では値を消さない（モバイルも同じ）', () => {
    const event = lockResultFields(showEvent('mobile.app.record.edit.show'), config(setting('on')));
    expect(event.record.on).toMatchObject({ disabled: true, value: 'コピー元の番号' });
  });
});

describe('numberRecord', () => {
  beforeEach(() => {
    executeNumbering.mockReset();
    executeNumbering.mockResolvedValue(undefined);
  });

  it('有効な設定だけを、順番に API トークンを付けて採番する', async () => {
    const event: KintoneEvent = {
      type: 'app.record.create.submit.success',
      appId: 1,
      recordId: 1,
      record: {},
    };
    await numberRecord(event, config(setting('a'), setting('off', false), setting('b')));

    // API トークンを保存してあれば、プロキシ設定のトークンで呼ぶよう伝える
    expect(executeNumbering.mock.calls.map(([, s, auth]) => [s.resultFieldCode, auth])).toEqual([
      ['a', { useApiToken: true }],
      ['b', { useApiToken: true }],
    ]);
  });
});
