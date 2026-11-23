import { useCallback, useMemo, useState } from 'react';
import { useAtomValue, type WritableAtom } from 'jotai';
import {
  FormProvider,
  useFormContext,
  type DefaultValues,
  type FieldValues,
  type KeepStateOptions,
} from 'react-hook-form';
import { Alert, Box, Button } from '@mui/material';
import {
  useExportConfig,
  useImportConfig,
  usePluginForm,
  useResetConfig,
  useSubmitConfig,
  useSyncConfig,
  logger,
  type DefinedPluginConfig,
} from '@kintone-plugin/kintone-utils';
import { Form, Header, type TabItem } from '@kintone-plugin/ui';

export type PluginContentProps<T extends FieldValues> = {
  definition: DefinedPluginConfig<T>;
  configAtom: WritableAtom<T, [T], void>;
  tabs: TabItem[];
  /** 保存済みの設定の読み込みに失敗したか（画面を開いた時点） */
  hasLoadError: boolean;
};

/** プラグイン一覧へ戻る */
const navigateBack = () => history.back();

/**
 * フォームの内容とヘッダーの操作（保存・キャンセル・リセット・インポート・エクスポート）
 */
const PluginContentForm = <T extends FieldValues>({
  definition,
  configAtom,
  tabs,
  hasLoadError,
}: PluginContentProps<T>) => {
  const { handleSubmit, formState, trigger } = useFormContext<T>();
  const { isDirty, isSubmitting } = formState;
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  // 保存に成功するまで警告を出す。リセット・インポートでは保存済みの設定は壊れたままなので消さない
  const [showLoadError, setShowLoadError] = useState(hasLoadError);
  const clearLoadError = useCallback(() => setShowLoadError(false), []);

  const { syncConfig } = useSyncConfig<T>(configAtom);
  const syncAndValidate = useCallback(
    (data: T, options?: KeepStateOptions) => {
      syncConfig(data, options);
      trigger().catch((e: unknown) => logger.error('Validation after import failed:', e));
    },
    [syncConfig, trigger]
  );
  const defaultConfig = useMemo(() => definition.createDefault(), [definition]);

  const menuActions = {
    reset: useResetConfig<T>({ defaultConfig, onSync: syncConfig }),
    // 秘密（API トークンなど）はファイルに書き出さない
    export: useExportConfig<T>({ pluginName: definition.name, transform: definition.toExport }),
    // 旧版でエクスポートしたファイルも読めるよう、移行を通してから検証する。
    // アプリのフィールドに依存する検証（存在しないフィールドなど）は、反映した直後に流して表示する
    import: useImportConfig<T>({
      schema: { safeParse: definition.parse },
      onSync: syncAndValidate,
    }),
  };

  const { onSubmit } = useSubmitConfig<T>({
    setLoading,
    onSave: definition.store,
    onSync: syncConfig,
    // 開発ビルドでは保存するデータをコンソールに出すので、秘密を除く
    redact: definition.toExport,
    onSuccess: clearLoadError,
    successAction: (
      <Button type='button' color='inherit' size='small' variant='outlined' onClick={navigateBack}>
        プラグイン一覧に戻る
      </Button>
    ),
  });

  const handleTabChange = useCallback((index: number) => setActiveTab(index), []);

  // 保存中は入力を止める（完了時に保存した内容で画面を更新するため、その間の変更は消えてしまう）
  const isSaving = loading || isSubmitting;
  // 読み込みに失敗したときは、変更が無くても既定値で保存し直せるようにする
  const isSaveDisabled = isSaving || (!isDirty && !showLoadError);

  return (
    <Box
      component='form'
      onSubmit={handleSubmit(onSubmit)}
      sx={{ minHeight: 'calc(100vh - 200px)', display: 'flex', flexDirection: 'column' }}
    >
      <Header
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onCancel={navigateBack}
        isSaveLoading={loading}
        isSaveDisabled={isSaveDisabled}
        menuActions={menuActions}
      />
      {showLoadError && (
        <Alert severity='warning' sx={{ mx: 3, mt: 2 }}>
          保存済みの設定の全部または一部（API
          トークンなど）を読み込めなかったため、読み込めなかった部分は既定値か空で表示しています。保存すると、表示中の内容で上書きされます（原因はブラウザのコンソールに出力しています）。
        </Alert>
      )}
      <Form tabs={tabs} activeTab={activeTab} disabled={isSaving} />
    </Box>
  );
};

/**
 * プラグイン設定画面のメインコンテンツ
 * フォームを初期化し、内部のコンポーネントから React Hook Form のコンテキストを使えるようにする
 */
export const PluginContent = <T extends FieldValues>(props: PluginContentProps<T>) => {
  const config = useAtomValue(props.configAtom);
  const methods = usePluginForm<T>({
    defaultValues: config as DefaultValues<T>,
    createSchema: props.definition.createValidationSchema,
  });

  return (
    <FormProvider {...methods}>
      <PluginContentForm {...props} />
    </FormProvider>
  );
};
