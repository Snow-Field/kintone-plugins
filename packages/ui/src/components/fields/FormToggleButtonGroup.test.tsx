import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { renderWithForm } from '../../test/FormHarness';
import { FormToggleButtonGroup } from './FormToggleButtonGroup';

type Form = { methods: string[] };

const options = [
  { value: 'GET', label: 'GET' },
  { value: 'POST', label: 'POST' },
  { value: 'PUT', label: 'PUT' },
];

describe('FormToggleButtonGroup', () => {
  it('保存済みの値を選んだ状態で表示し、押した選択肢を選択肢の順で保存する', async () => {
    const user = userEvent.setup();
    const { form } = renderWithForm<Form>(
      <FormToggleButtonGroup<Form> name='methods' label='メソッド' options={options} />,
      { methods: ['PUT'] }
    );
    expect(screen.getByRole('button', { name: 'PUT' }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByRole('button', { name: 'GET' }).getAttribute('aria-pressed')).toBe('false');

    await user.click(screen.getByRole('button', { name: 'GET' }));
    expect(form().getValues('methods')).toEqual(['GET', 'PUT']);

    await user.click(screen.getByRole('button', { name: 'PUT' }));
    expect(form().getValues('methods')).toEqual(['GET']);
  });

  it('検証エラーのメッセージを表示する', () => {
    const { form } = renderWithForm<Form>(
      <FormToggleButtonGroup<Form> name='methods' label='メソッド' options={options} />,
      { methods: [] }
    );
    act(() => form().setError('methods', { message: 'メソッドを選んでください' }));
    expect(screen.getByText('メソッドを選んでください')).toBeTruthy();
  });
});
