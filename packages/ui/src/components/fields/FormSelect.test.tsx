import { act, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { renderWithForm } from '../../test/FormHarness';
import { FormSelect } from './FormSelect';

type Form = { operator: string };

const options = [
  { value: 'equals', label: '等しい' },
  { value: 'notEquals', label: '等しくない' },
];

describe('FormSelect', () => {
  it('保存済みの値のラベルを表示し、選んだ値を保存して onValueChange に渡す', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    const { form } = renderWithForm<Form>(
      <FormSelect<Form>
        name='operator'
        label='演算子'
        options={options}
        onValueChange={onValueChange}
      />,
      { operator: 'equals' }
    );
    const select = screen.getByRole('combobox', { name: '演算子' });
    expect(select.textContent).toBe('等しい');

    await user.click(select);
    await user.click(
      within(screen.getByRole('listbox')).getByRole('option', { name: '等しくない' })
    );

    expect(form().getValues('operator')).toBe('notEquals');
    expect(onValueChange).toHaveBeenCalledWith('notEquals');
  });

  it('選択肢に無い値が保存されていると、未選択として表示する', () => {
    renderWithForm<Form>(<FormSelect<Form> name='operator' label='演算子' options={options} />, {
      operator: 'removed',
    });
    expect(screen.getByRole('combobox', { name: '演算子' }).textContent).not.toContain('removed');
  });

  it('検証エラーのメッセージを表示する', () => {
    const { form } = renderWithForm<Form>(
      <FormSelect<Form> name='operator' label='演算子' options={options} />,
      { operator: '' }
    );

    act(() => form().setError('operator', { message: '演算子を選んでください' }));

    expect(screen.getByText('演算子を選んでください')).toBeTruthy();
  });
});
