import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { NumberingSetting } from '@/shared/config';
import type { KintoneEvent } from '@/shared/types/kintone';
import { DEFAULT_RETRY_COUNT } from '@/shared/config/constants';
import { checkDuplicate, fetchRecord, updateRecord } from '@/shared/api/records';
import { resolveNextSerial } from '@/shared/api/serial';
import { executeNumbering } from './numbering';

// API の呼び出しは読み込み時にプラグイン ID を読むので、読み込む前に用意する
vi.hoisted(() => {
  vi.stubGlobal('kintone', { $PLUGIN_ID: 'plugin-id' });
  // kintone-utils は読み込み時に URL を読む
  vi.stubGlobal('location', { pathname: '/k/1/' });
});

const auth = { useApiToken: false };

// kintone REST API を呼ぶ処理だけをモックし、フォーマット処理は実物を使う
vi.mock('@/shared/api/records', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/shared/api/records')>();
  return {
    ...actual,
    fetchRecord: vi.fn(),
    updateRecord: vi.fn(),
    checkDuplicate: vi.fn(),
  };
});
vi.mock('@/shared/api/serial', () => ({ resolveNextSerial: vi.fn() }));

const setting: NumberingSetting = {
  id: 'setting-1',
  enabled: true,
  resultFieldCode: '採番結果',
  formatParts: [{ type: 'text', value: 'INV' }],
  connector: '-',
  serialConfig: { initialValue: 1, digit: 4, position: 'suffix', resetTiming: 'none' },
};

const createEvent = (resultValue = '') =>
  ({
    appId: 1,
    recordId: 10,
    record: { 採番結果: { type: 'SINGLE_LINE_TEXT', value: resultValue } },
  }) as unknown as KintoneEvent;

describe('executeNumbering', () => {
  beforeEach(() => {
    vi.stubGlobal('alert', vi.fn());
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.mocked(fetchRecord).mockResolvedValue({
      $revision: { type: '__REVISION__', value: '5' },
    } as unknown as Awaited<ReturnType<typeof fetchRecord>>);
    vi.mocked(resolveNextSerial).mockResolvedValue({ nextSerial: 7, existingValues: new Set() });
    vi.mocked(checkDuplicate).mockResolvedValue(false);
    vi.mocked(updateRecord).mockResolvedValue();
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('採番済みのレコードは何もしない', async () => {
    await executeNumbering(createEvent('INV-0001'), setting, auth);

    expect(fetchRecord).not.toHaveBeenCalled();
    expect(updateRecord).not.toHaveBeenCalled();
  });

  it('連番をゼロ埋めして採番値を組み立て、リビジョン付きで更新する', async () => {
    await executeNumbering(createEvent(), setting, { useApiToken: true });

    expect(updateRecord).toHaveBeenCalledWith(
      expect.objectContaining({
        appId: 1,
        recordId: 10,
        resultFieldCode: '採番結果',
        numberingValue: 'INV-0007',
        currentSerial: 7,
        revision: '5',
        auth: { useApiToken: true },
      })
    );
  });

  it('重複していたら連番を進めて再試行する', async () => {
    vi.mocked(checkDuplicate).mockResolvedValueOnce(true).mockResolvedValueOnce(true);

    await executeNumbering(createEvent(), setting, auth);

    expect(checkDuplicate).toHaveBeenCalledTimes(3);
    expect(updateRecord).toHaveBeenCalledTimes(1);
    expect(updateRecord).toHaveBeenCalledWith(
      expect.objectContaining({ numberingValue: 'INV-0009', currentSerial: 9 })
    );
  });

  it(`重複が ${DEFAULT_RETRY_COUNT} 回続いたらエラーにして利用者に通知する`, async () => {
    vi.mocked(checkDuplicate).mockResolvedValue(true);

    await expect(executeNumbering(createEvent(), setting, auth)).rejects.toThrow(
      `最大リトライ回数（${DEFAULT_RETRY_COUNT}）に達しました`
    );
    expect(checkDuplicate).toHaveBeenCalledTimes(DEFAULT_RETRY_COUNT);
    expect(updateRecord).not.toHaveBeenCalled();
    expect(alert).toHaveBeenCalledWith(expect.stringContaining('最大リトライ回数'));
  });

  it('API の失敗は利用者に通知したうえで呼び出し元へ投げ直す', async () => {
    vi.mocked(updateRecord).mockRejectedValue(new Error('409 Conflict'));

    await expect(executeNumbering(createEvent(), setting, auth)).rejects.toThrow('409 Conflict');
    expect(alert).toHaveBeenCalledWith('採番処理に失敗しました: 409 Conflict');
  });
});
