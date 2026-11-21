import { useCallback, useMemo, useState } from 'react';
import { useAtomValue, type WritableAtom } from 'jotai';
import {
  FormProvider,
  useFormContext,
  type DefaultValues,
  type FieldValues,
} from 'react-hook-form';
import { Alert, Box, Button } from '@mui/material';
import {
  useExportConfig,
  useImportConfig,
  usePluginForm,
  useResetConfig,
  useSubmitConfig,
  useSyncConfig,
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
  const { handleSubmit, formState } = useFormContext<T>();
  const { isDirty, isSubmitting } = formState;
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  // 保存に成功するまで警告を出す。リセット・インポートでは保存済みの設定は壊れたままなので消さない
  const [showLoadError, setShowLoadError] = useState(hasLoadError);
  const clearLoadError = useCallback(() => setShowLoadError(false), []);

  const { syncConfig } = useSyncConfig<T>(configAtom);
  const defaultConfig = useMemo(() => definition.createDefault(), [definition]);

  const menuActions = {
    reset: useResetConfig<T>({ defaultConfig, onSync: syncConfig }),
    export: useExportConfig<T>({ pluginName: definition.name }),
    import: useImportConfig<T>({ schema: definition.schema, onSync: syncConfig }),
  };

  const { onSubmit } = useSubmitConfig<T>({
    setLoading,
    onSave: definition.store,
    onSync: syncConfig,
    onSuccess: clearLoadError,
    successAction: (
      <Button type='button' color='inherit' size='small' variant='outlined' onClick={navigateBack}>
        プラグイン一覧に戻る
      </Button>
    ),
  });

  const handleTabChange = useCallback((index: number) => setActiveTab(index), []);

  // 読み込みに失敗したときは、変更が無くても既定値で保存し直せるようにする
  const isSaveDisabled = loading || isSubmitting || (!isDirty && !showLoadError);

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
          保存済みの設定を読み込めなかったため、既定値を表示しています。保存すると、表示中の内容で上書きされます（原因はブラウザのコンソールに出力しています）。
        </Alert>
      )}
      <Form tabs={tabs} activeTab={activeTab} />
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
