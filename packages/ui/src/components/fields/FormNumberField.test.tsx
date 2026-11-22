import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { renderWithForm } from '../../test/FormHarness';
import { FormNumberField } from './FormNumberField';

type Form = { digit: number | null };

describe('FormNumberField', () => {
  it('保存済みの数値を表示し、入力した値を数値で保存する', async () => {
    const user = userEvent.setup();
    const { form } = renderWithForm<Form>(<FormNumberField<Form> name='digit' label='桁数' />, {
      digit: 5,
    });
    const input = screen.getByRole('spinbutton', { name: '桁数' });
    expect(input).toHaveProperty('value', '5');

    await user.clear(input);
    await user.type(input, '12');

    expect(form().getValues('digit')).toBe(12);
  });

  it('空にすると null を保存する', async () => {
    const user = userEvent.setup();
    const { form } = renderWithForm<Form>(<FormNumberField<Form> name='digit' label='桁数' />, {
      digit: 5,
    });

    await user.clear(screen.getByRole('spinbutton', { name: '桁数' }));

    expect(form().getValues('digit')).toBeNull();
  });

  it('検証エラーのメッセージを表示する', () => {
    const { form } = renderWithForm<Form>(<FormNumberField<Form> name='digit' label='桁数' />, {
      digit: null,
    });

    act(() => form().setError('digit', { message: '桁数を入力してください' }));

    expect(screen.getByText('桁数を入力してください')).toBeTruthy();
  });
});
