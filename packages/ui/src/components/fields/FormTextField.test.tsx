import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { renderWithForm } from '../../test/FormHarness';
import { FormTextField } from './FormTextField';

type Form = { unit: string };

describe('FormTextField', () => {
  it('保存済みの値を表示し、入力した値を保存する', async () => {
    const user = userEvent.setup();
    const { form } = renderWithForm<Form>(<FormTextField<Form> name='unit' label='単位' />, {
      unit: '歳',
    });
    const input = screen.getByRole('textbox', { name: '単位' });
    expect(input).toHaveProperty('value', '歳');

    await user.clear(input);
    await user.type(input, 'さい');

    expect(form().getValues('unit')).toBe('さい');
  });

  it('検証エラーのメッセージを表示する', () => {
    const { form } = renderWithForm<Form>(<FormTextField<Form> name='unit' label='単位' />, {
      unit: '',
    });

    act(() => form().setError('unit', { message: '単位を入力してください' }));

    expect(screen.getByText('単位を入力してください')).toBeTruthy();
    expect(screen.getByRole('textbox', { name: '単位' }).getAttribute('aria-invalid')).toBe('true');
  });
});
