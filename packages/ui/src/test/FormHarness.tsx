import { type ReactNode, useEffect } from 'react';
import {
  type DefaultValues,
  type FieldValues,
  FormProvider,
  useForm,
  type UseFormReturn,
} from 'react-hook-form';
import { render } from '@testing-library/react';

type FormHarnessProps<T extends FieldValues> = {
  defaultValues: DefaultValues<T>;
  onReady: (form: UseFormReturn<T>) => void;
  children: ReactNode;
};

/** フォームを用意し、テストから値を読めるように React Hook Form の操作を渡す */
const FormHarness = <T extends FieldValues>({
  defaultValues,
  onReady,
  children,
}: FormHarnessProps<T>) => {
  const form = useForm<T>({ defaultValues });
  useEffect(() => {
    onReady(form);
  });
  return <FormProvider {...form}>{children}</FormProvider>;
};

/** 部品をフォームの中に描画し、フォームの操作を取り出す関数を返す（テスト用） */
export const renderWithForm = <T extends FieldValues>(
  ui: ReactNode,
  defaultValues: DefaultValues<T>
) => {
  const methods: { current?: UseFormReturn<T> } = {};
  render(
    <FormHarness<T>
      defaultValues={defaultValues}
      onReady={(form) => {
        methods.current = form;
      }}
    >
      {ui}
    </FormHarness>
  );
  return {
    form: () => {
      if (!methods.current) throw new Error('フォームが描画されていません');
      return methods.current;
    },
  };
};
