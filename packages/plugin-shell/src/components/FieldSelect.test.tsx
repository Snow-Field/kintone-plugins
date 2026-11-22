import { type ReactNode, useEffect } from 'react';
import { FormProvider, useForm, type UseFormReturn } from 'react-hook-form';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AppField } from '@kintone-plugin/kintone-utils';
import { FieldSelect, type FieldSelectProps } from './FieldSelect';

// 実物は kintone の REST API でフィールドを取得するため、取得済みの一覧を返すモックに置き換える
const { useAppFields } = vi.hoisted(() => ({ useAppFields: vi.fn() }));
vi.mock('@kintone-plugin/kintone-utils', () => ({ useAppFields }));

const field = (code: string, label: string, type: AppField['type']) =>
  ({ code, label, type }) as AppField;

const appFields = [
  field('birthday', '誕生日', 'DATE'),
  field('joined', '入社日', 'DATE'),
  field('name', '氏名', 'SINGLE_LINE_TEXT'),
];

type Form = { target: string; targets: string[] };

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

const renderFieldSelect = (
  props: Omit<FieldSelectProps<Form>, 'name'> & { name?: FieldSelectProps<Form>['name'] },
  defaultValues: Partial<Form> = {}
) => {
  const methods: { current?: UseFormReturn<Form> } = {};
  render(
    <FormHarness
      defaultValues={{ target: '', targets: [], ...defaultValues }}
      onReady={(form) => {
        methods.current = form;
      }}
    >
      <FieldSelect<Form> name='target' label='フィールド' {...props} />
    </FormHarness>
  );
  return {
    getValues: () => {
      if (!methods.current) throw new Error('フォームが描画されていません');
      return methods.current.getValues();
    },
  };
};

const optionTexts = () =>
  within(screen.getByRole('listbox'))
    .getAllByRole('option')
    .map((o) => o.textContent);

describe('FieldSelect', () => {
  beforeEach(() => {
    useAppFields.mockImplementation((types?: readonly string[]) => ({
      fields: types ? appFields.filter((f) => types.includes(f.type)) : appFields,
    }));
  });

  it('指定した種類のフィールドを、名前とコードで表示する', async () => {
    const user = userEvent.setup();
    const fieldTypes = ['DATE'] as const;
    renderFieldSelect({ fieldTypes });

    await user.click(screen.getByRole('combobox', { name: 'フィールド' }));

    expect(useAppFields).toHaveBeenCalledWith(fieldTypes);
    expect(optionTexts()).toEqual(['誕生日birthday', '入社日joined']);
  });

  it('フィールドコードでも絞り込める', async () => {
    const user = userEvent.setup();
    renderFieldSelect({});

    await user.type(screen.getByRole('combobox', { name: 'フィールド' }), 'join');

    expect(optionTexts()).toEqual(['入社日joined']);
  });

  it('選ぶとフィールドコードを保存する', async () => {
    const user = userEvent.setup();
    const { getValues } = renderFieldSelect({});

    await user.click(screen.getByRole('combobox', { name: 'フィールド' }));
    await user.click(screen.getByRole('option', { name: /氏名/ }));

    expect(getValues().target).toBe('name');
  });

  it('filter で外したフィールドは選択肢に出さない', async () => {
    const user = userEvent.setup();
    renderFieldSelect({ filter: (f) => f.code !== 'birthday' });

    await user.click(screen.getByRole('combobox', { name: 'フィールド' }));

    expect(optionTexts()).toEqual(['入社日joined', '氏名name']);
  });

  it('filter が外しても、この入力欄で選んでいるフィールドは残す', async () => {
    const user = userEvent.setup();
    renderFieldSelect({ filter: (f) => f.code !== 'birthday' }, { target: 'birthday' });

    expect(screen.getByRole('combobox', { name: 'フィールド' })).toHaveProperty('value', '誕生日');

    await user.click(screen.getByRole('combobox', { name: 'フィールド' }));

    expect(optionTexts()).toEqual(['誕生日birthday', '入社日joined', '氏名name']);
  });

  it('同じ名前のフィールドがあっても、選んだほうのコードを保存する', async () => {
    const user = userEvent.setup();
    useAppFields.mockReturnValue({
      fields: [field('date1', '日付', 'DATE'), field('date2', '日付', 'DATE')],
    });
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const { getValues } = renderFieldSelect({});

    await user.click(screen.getByRole('combobox', { name: 'フィールド' }));
    await user.click(screen.getByRole('option', { name: /date2/ }));

    expect(getValues().target).toBe('date2');
    // 一覧の行の key が重なると、React が警告を出す
    expect(consoleError).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it('groupBy でフィールドを見出しごとにまとめる', async () => {
    const user = userEvent.setup();
    renderFieldSelect({ groupBy: (f) => (f.type === 'DATE' ? '日付' : 'その他') });

    await user.click(screen.getByRole('combobox', { name: 'フィールド' }));

    expect(screen.getByRole('listbox').textContent).toMatch(/^日付.*その他/);
  });

  it('multiple のとき、選んだフィールドのコードを配列で保存する', async () => {
    const user = userEvent.setup();
    const { getValues } = renderFieldSelect(
      { name: 'targets', multiple: true },
      { targets: ['birthday'] }
    );

    expect(screen.getByRole('button', { name: '誕生日' })).toBeTruthy();

    await user.click(screen.getByRole('combobox', { name: 'フィールド' }));
    await user.click(screen.getByRole('option', { name: /氏名/ }));

    expect(getValues().targets).toEqual(['birthday', 'name']);
  });
});
