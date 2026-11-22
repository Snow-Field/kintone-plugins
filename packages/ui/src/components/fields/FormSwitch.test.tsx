import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { renderWithForm } from '../../test/FormHarness';
import { FormSwitch } from './FormSwitch';

type Form = { enabled: boolean };

describe('FormSwitch', () => {
  it('保存済みの値を表示し、切り替えた値を保存する', async () => {
    const user = userEvent.setup();
    const { form } = renderWithForm<Form>(<FormSwitch<Form> name='enabled' label='有効にする' />, {
      enabled: true,
    });
    const toggle = screen.getByRole('switch', { name: '有効にする' });
    expect(toggle).toHaveProperty('checked', true);

    await user.click(toggle);

    expect(form().getValues('enabled')).toBe(false);
  });

  it('検証エラーのメッセージを表示する', () => {
    const { form } = renderWithForm<Form>(<FormSwitch<Form> name='enabled' label='有効にする' />, {
      enabled: false,
    });

    act(() => form().setError('enabled', { message: '有効にしてください' }));

    expect(screen.getByText('有効にしてください')).toBeTruthy();
  });
});
