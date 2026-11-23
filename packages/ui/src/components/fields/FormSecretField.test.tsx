import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { renderWithForm } from '../../test/FormHarness';
import { FormSecretField } from './FormSecretField';

type Form = { token: string };

describe('FormSecretField', () => {
  it('既定は伏せ字で表示し、ボタンで表示と伏せ字を切り替える', async () => {
    const user = userEvent.setup();
    renderWithForm<Form>(<FormSecretField<Form> name='token' label='トークン' />, {
      token: 'secret',
    });
    const input = screen.getByLabelText('トークン');
    expect(input.getAttribute('type')).toBe('password');
    expect(input.getAttribute('autocomplete')).toBe('new-password');

    await user.click(screen.getByRole('button', { name: 'トークンを表示する' }));
    expect(input.getAttribute('type')).toBe('text');

    await user.click(screen.getByRole('button', { name: 'トークンを隠す' }));
    expect(input.getAttribute('type')).toBe('password');
  });

  it('入力した値を保存する', async () => {
    const user = userEvent.setup();
    const { form } = renderWithForm<Form>(<FormSecretField<Form> name='token' label='トークン' />, {
      token: '',
    });
    await user.type(screen.getByLabelText('トークン'), 'abc');
    expect(form().getValues('token')).toBe('abc');
  });
});
