// @vitest-environment jsdom
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SAVE_SLOW_MS, SAVE_TIMEOUT_MS } from '../lib/pluginConfig';
import { useSubmitConfig } from './useSubmitConfig';

const { enqueueSnackbar, closeSnackbar } = vi.hoisted(() => ({
  enqueueSnackbar: vi.fn(),
  closeSnackbar: vi.fn(),
}));
vi.mock('notistack', () => ({ useSnackbar: () => ({ enqueueSnackbar, closeSnackbar }) }));

type Config = { version: number };

const setup = ({
  onSave = (_: Config, callback: () => void) => callback(),
  onSync = vi.fn(),
}: {
  onSave?: (data: Config, callback: () => void) => void;
  onSync?: (data: Config) => void;
} = {}) => {
  const setLoading = vi.fn();
  const onSuccess = vi.fn();
  const onError = vi.fn();
  const { result } = renderHook(() =>
    useSubmitConfig<Config>({ setLoading, onSave, onSync, onSuccess, onError })
  );
  return { submit: result.current.onSubmit, setLoading, onSuccess, onError };
};

/** 出した通知の種類（variant）を順に返す */
const notices = () =>
  enqueueSnackbar.mock.calls.map(([, options]) => (options as { variant: string }).variant);

describe('useSubmitConfig', () => {
  beforeEach(() => {
    // 保存処理はログをコンソールに出すので、テストの出力から外す
    for (const method of ['log', 'info', 'warn', 'error', 'group', 'groupEnd'] as const) {
      vi.spyOn(console, method).mockImplementation(() => undefined);
    }
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    enqueueSnackbar.mockReset();
    closeSnackbar.mockReset();
    vi.useRealTimers();
  });

  it('保存と画面の更新に成功したら、成功を知らせて onSuccess を呼ぶ', async () => {
    const onSync = vi.fn();
    const { submit, setLoading, onSuccess, onError } = setup({ onSync });

    await act(() => submit({ version: 1 }));

    expect(onSync).toHaveBeenCalledWith({ version: 1 });
    expect(notices()).toEqual(['success']);
    expect(onSuccess).toHaveBeenCalledTimes(1);
    expect(onError).not.toHaveBeenCalled();
    expect(setLoading.mock.calls).toEqual([[true], [false]]);
  });

  it('保存の処理が例外を投げたら、失敗を知らせて onError を呼ぶ', async () => {
    const { submit, onSuccess, onError } = setup({
      onSave: () => {
        throw new Error('保存できません');
      },
    });

    await act(() => submit({ version: 1 }));

    expect(notices()).toEqual(['error']);
    expect(onError).toHaveBeenCalledTimes(1);
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it('保存の後の画面の更新に失敗したら、警告を出し、onSuccess は呼ばない', async () => {
    const { submit, onSuccess, onError } = setup({
      onSync: () => {
        throw new Error('更新できません');
      },
    });

    await act(() => submit({ version: 1 }));

    expect(notices()).toEqual(['warning']);
    expect(onSuccess).not.toHaveBeenCalled();
    expect(onError).not.toHaveBeenCalled();
  });

  it('保存の完了が遅れたら、保存中のまま待っていることを知らせ、届いた時点で成功として扱う', async () => {
    vi.useFakeTimers();
    enqueueSnackbar.mockReturnValueOnce('slow-notice');
    let complete: (() => void) | undefined;
    const onSync = vi.fn();
    const { submit, setLoading, onSuccess, onError } = setup({
      onSave: (_, callback) => {
        complete = callback;
      },
      onSync,
    });

    let submitting: Promise<void> | undefined;
    act(() => {
      submitting = submit({ version: 1 });
    });
    await act(async () => {
      vi.advanceTimersByTime(SAVE_SLOW_MS);
    });

    // 失敗とは知らせず、遅れて完了したときに上書きしないよう保存中のままにする
    expect(notices()).toEqual(['info']);
    expect(setLoading.mock.calls).toEqual([[true]]);
    expect(onError).not.toHaveBeenCalled();

    await act(async () => {
      complete?.();
      await submitting;
    });

    expect(closeSnackbar).toHaveBeenCalledWith('slow-notice');
    expect(onSync).toHaveBeenCalledWith({ version: 1 });
    expect(notices()).toEqual(['info', 'success']);
    expect(onSuccess).toHaveBeenCalledTimes(1);
    expect(setLoading).toHaveBeenLastCalledWith(false);
  });

  it('打ち切りの時間までに完了しなければ、失敗と言い切らずに確かめるよう知らせる', async () => {
    vi.useFakeTimers();
    const { submit, setLoading, onSuccess, onError } = setup({ onSave: () => undefined });

    let submitting: Promise<void> | undefined;
    act(() => {
      submitting = submit({ version: 1 });
    });
    await act(async () => {
      vi.advanceTimersByTime(SAVE_TIMEOUT_MS);
      await submitting;
    });

    expect(notices()).toEqual(['info', 'error']);
    expect(enqueueSnackbar.mock.calls[1]?.[0]).toContain('確かめてください');
    expect(onError).toHaveBeenCalledTimes(1);
    expect(onSuccess).not.toHaveBeenCalled();
    expect(setLoading).toHaveBeenLastCalledWith(false);
  });
});
