import { useMemo, useEffect } from 'react';
import { useForm, type FieldValues, type DefaultValues } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { z } from 'zod';
import { useAppFields } from './useAppFields';
import { useUnsavedChanges } from './useUnsavedChanges';
import type { FieldType } from '../types';

type FieldInfo = {
  code: string;
  type: FieldType;
};

type UsePluginFormProps<T extends FieldValues> = {
  /** プラグインの初期設定値 */
  defaultValues: DefaultValues<T>;
  /** フィールド情報のリストを受け取ってスキーマを生成する関数 */
  createSchema: (fields: FieldInfo[]) => z.ZodType<T, any, any>;
};

/**
 * kintoneプラグイン設定フォームの基盤となるフック
 * フィールド一覧の取得、動的なスキーマ生成、未保存時の離脱防止を一括で提供する
 */
export const usePluginForm = <T extends FieldValues>({
  defaultValues,
  createSchema,
}: UsePluginFormProps<T>) => {
  const { fields } = useAppFields();

  // フィールド情報のリストを作成
  const fieldInfoList = useMemo(
    () => fields.map((f) => ({ code: f.code, type: f.type })),
    [fields]
  );

  // 動的なスキーマの生成
  const schema = useMemo(() => createSchema(fieldInfoList), [createSchema, fieldInfoList]);

  const methods = useForm<T>({
    resolver: zodResolver(schema) as any,
    defaultValues,
    mode: 'all', // 全ての変更を監視し、検証を行う
  });

  // 初期化時またはフィールドリスト更新時にバリデーションを実行
  useEffect(() => {
    if (fieldInfoList.length > 0) methods.trigger();
  }, [methods, fieldInfoList]);

  // 未保存時の離脱防止を適用
  useUnsavedChanges(methods.formState.isDirty);

  return methods;
};
