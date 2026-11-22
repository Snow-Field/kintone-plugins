import { useEffect, type ReactNode } from 'react';
import { FormProvider, useForm, type UseFormReturn } from 'react-hook-form';
import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { FormAutocomplete } from './FormAutocomplete';

type Form = { single: string; many: string[] };

const options = [
  { value: 'create', label: '作成時' },
  { value: 'edit', label: '編集時' },
  { value: 'delete', label: '削除時' },
];

type FormHarnessProps = {
  defaultValues: Form;
  onReady: (form: UseFormReturn<Form>) => void;
  children: ReactNode;
};

/** フォームを用意し、テストから値を読めるように React Hook Form の操作を渡す */
const FormHarness = ({ defaultValues, onReady, children }: FormHarnessProps) => {
  const form = useForm<Form>({ defaultValues });
  useEffect(() => {
    onReady(form);
  });
  return <FormProvider {...form}>{children}</FormProvider>;
};

const renderWithForm = (ui: ReactNode, defaultValues: Partial<Form> = {}) => {
  const methods: { current?: UseFormReturn<Form> } = {};
  render(
    <FormHarness
      defaultValues={{ single: '', many: [], ...defaultValues }}
      onReady={(form) => {
        methods.current = form;
      }}
    >
      {ui}
    </FormHarness>
  );
  const form = () => {
    if (!methods.current) throw new Error('フォームが描画されていません');
    return methods.current;
  };
  return { form };
};

describe('FormAutocomplete（1つ選ぶ）', () => {
  it('保存済みの値に対応する選択肢のラベルを表示する', () => {
    renderWithForm(<FormAutocomplete<Form> name='single' label='契機' options={options} />, {
      single: 'edit',
    });
    expect(screen.getByRole('combobox', { name: '契機' })).toHaveProperty('value', '編集時');
  });

  it('選択肢に無い値が保存されていると、未選択として表示する', () => {
    renderWithForm(<FormAutocomplete<Form> name='single' label='契機' options={options} />, {
      single: 'removed',
    });
    expect(screen.getByRole('combobox', { name: '契機' })).toHaveProperty('value', '');
  });

  it('選ぶと選択肢の value を保存し、onValueChange に渡す', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    const { form } = renderWithForm(
      <FormAutocomplete<Form>
        name='single'
        label='契機'
        options={options}
        onValueChange={onValueChange}
      />
    );

    await user.click(screen.getByRole('combobox', { name: '契機' }));
    await user.click(screen.getByRole('option', { name: '削除時' }));

    expect(form().getValues('single')).toBe('delete');
    expect(onValueChange).toHaveBeenCalledWith('delete');
  });

  it('選択を消すと空文字を保存する', async () => {
    const user = userEvent.setup();
    const { form } = renderWithForm(
      <FormAutocomplete<Form> name='single' label='契機' options={options} />,
      { single: 'edit' }
    );

    await user.click(screen.getByRole('combobox', { name: '契機' }));
    await user.click(screen.getByRole('button', { name: 'Clear' }));

    expect(form().getValues('single')).toBe('');
  });

  it('検証エラーのメッセージを表示する', () => {
    const { form } = renderWithForm(
      <FormAutocomplete<Form> name='single' label='契機' options={options} />
    );

    act(() => form().setError('single', { message: '契機を選んでください' }));

    expect(screen.getByText('契機を選んでください')).toBeTruthy();
    expect(screen.getByRole('combobox', { name: '契機' }).getAttribute('aria-invalid')).toBe(
      'true'
    );
  });

  it('groupBy を渡すと、同じグループの選択肢を最初に現れたグループの順にまとめる', async () => {
    const user = userEvent.setup();
    const grouped = [
      { value: 'a', label: 'A', group: '文字列' },
      { value: 'b', label: 'B', group: '数値' },
      { value: 'c', label: 'C', group: '文字列' },
    ];
    renderWithForm(
      <FormAutocomplete<Form, (typeof grouped)[number]>
        name='single'
        label='項目'
        options={grouped}
        groupBy={(o) => o.group}
      />
    );

    await user.click(screen.getByRole('combobox', { name: '項目' }));

    const listbox = screen.getByRole('listbox');
    expect(
      within(listbox)
        .getAllByRole('option')
        .map((o) => o.textContent)
    ).toEqual(['A', 'C', 'B']);
    expect(listbox.textContent).toMatch(/^文字列.*数値/);
  });
});

describe('FormAutocomplete（複数選ぶ）', () => {
  it('保存済みの値をチップで表示し、選ぶと配列に加える', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    const { form } = renderWithForm(
      <FormAutocomplete<Form>
        name='many'
        label='契機'
        options={options}
        multiple
        onValueChange={onValueChange}
      />,
      { many: ['create'] }
    );

    expect(screen.getByRole('button', { name: '作成時' })).toBeTruthy();

    await user.click(screen.getByRole('combobox', { name: '契機' }));
    await user.click(screen.getByRole('option', { name: '削除時' }));

    expect(form().getValues('many')).toEqual(['create', 'delete']);
    expect(onValueChange).toHaveBeenCalledWith(['create', 'delete']);
    // 続けて選べるように、選んだ後も一覧を閉じない
    expect(screen.getByRole('listbox')).toBeTruthy();
  });

  it('選択肢に無い値は表示せず、次に選んだときに保存値から外れる', async () => {
    const user = userEvent.setup();
    const { form } = renderWithForm(
      <FormAutocomplete<Form> name='many' label='契機' options={options} multiple />,
      { many: ['removed', 'edit'] }
    );

    expect(screen.queryByRole('button', { name: 'removed' })).toBeNull();

    await user.click(screen.getByRole('combobox', { name: '契機' }));
    await user.click(screen.getByRole('option', { name: '作成時' }));

    expect(form().getValues('many')).toEqual(['edit', 'create']);
  });
});
