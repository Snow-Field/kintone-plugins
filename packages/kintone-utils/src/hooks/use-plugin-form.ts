import { useMemo, useEffect } from 'react';
import { useForm, type FieldValues, type DefaultValues, type UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAppFields } from './use-app-fields';
import { useUnsavedChanges } from './use-unsaved-changes';

type UsePluginFormProps<T extends FieldValues> = {
  /** プラグインの初期設定値 */
  defaultValues: DefaultValues<T>;
  /** フィールドコードのリストを受け取ってスキーマを生成する関数 */
  createSchema: (fieldCodes: string[]) => z.ZodType<T, any, any>;
};

/**
 * kintoneプラグイン設定フォームの基盤となるフック
 * フィールド一覧の取得、動的なスキーマ生成、未保存時の離脱防止を一括で提供する
 */
export const usePluginForm = <T extends FieldValues>({ defaultValues, createSchema }: UsePluginFormProps<T>) => {
  const { fields } = useAppFields();

  // フィールドコードのリストを抽出
  const fieldCodes = useMemo(() => fields.map((f) => f.code), [fields]);

  // 動的なスキーマの生成
  const schema = useMemo(() => createSchema(fieldCodes), [createSchema, fieldCodes]);

  const methods = useForm<T>({
    resolver: zodResolver(schema) as any,
    defaultValues,
    mode: 'all', // 全ての変更を監視し、検証を行う
  });

  // 初期化時またはフィールドリスト更新時にバリデーションを実行
  // これにより、kintone側でフィールドが削除された際のエラーを表示させる
  useEffect(() => {
    if (fieldCodes.length > 0) {
      methods.trigger();
    }
  }, [methods, fieldCodes]);

  // 未保存時の離脱防止を適用
  useUnsavedChanges(methods.formState.isDirty);

  return methods;
};
