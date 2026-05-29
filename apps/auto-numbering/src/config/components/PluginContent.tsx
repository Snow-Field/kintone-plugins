import { type FC, useCallback, Suspense } from 'react';
import { useAtom, useAtomValue } from 'jotai';
import { FormProvider, useFormContext } from 'react-hook-form';
import { Box, Button, Typography } from '@mui/material';
import { activeTabIndexAtom, loadingAtom } from '@/config/states/plugin';
import { usePluginForm } from '@/config/hooks/usePluginForm';
import { useSubmitConfig } from '@/config/hooks/useSubmitConfig';
import { useResetConfig } from '@/config/hooks/useResetConfig';
import { useImportConfig } from '@/config/hooks/useImportConfig';
import { useExportConfig } from '@/config/hooks/useExportConfig';
import { type PluginConfig } from '@/shared/config';
import { Header, Form, WaveLoader } from '@kintone-plugin/ui';
import { FormTabs } from '@/config/components/features/FormTabs';

/**
 * フィールド情報読み込み中のローディング表示
 */
const FieldsLoadingFallback: FC = () => (
  <Box
    sx={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '400px',
      gap: 2,
    }}
  >
    <WaveLoader />
    <Typography variant='body2' color='text.secondary'>
      フィールド情報を読み込んでいます...
    </Typography>
  </Box>
);

/**
 * 実際のフォーム内容とロジックを管理する内部コンポーネント
 */
const PluginContentForm: FC = () => {
  const { handleSubmit, formState } = useFormContext<PluginConfig>();
  const [activeTab, setActiveTab] = useAtom(activeTabIndexAtom);

  /** 状態 */
  const loading = useAtomValue(loadingAtom);
  const { isDirty, isSubmitting } = formState;

  /** メニューアクション */
  const resetConfig = useResetConfig();
  const exportConfig = useExportConfig();
  const importConfig = useImportConfig();

  const menuActions = {
    reset: resetConfig,
    export: exportConfig,
    import: importConfig,
  };

  /** プラグイン一覧へ戻る処理 */
  const handleNavigateBack = useCallback(() => history.back(), []);

  /** タブ変更ハンドラ */
  const handleTabChange = (index: number) => {
    setActiveTab(index);
  };

  /** 送信処理の初期化 */
  const { onSubmit } = useSubmitConfig({
    successAction: (
      <Button
        type='button'
        color='inherit'
        size='small'
        variant='outlined'
        onClick={handleNavigateBack}
      >
        プラグイン一覧に戻る
      </Button>
    ),
  });

  /** フォーム送信ハンドラ */
  const handleFormSubmit = handleSubmit(onSubmit);

  return (
    <Box
      component='form'
      onSubmit={handleFormSubmit}
      sx={{ minHeight: 'calc(100vh - 200px)', display: 'flex', flexDirection: 'column' }}
    >
      <Header
        tabs={FormTabs}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onCancel={handleNavigateBack}
        isSaveLoading={loading}
        isSaveDisabled={loading || !isDirty || isSubmitting}
        menuActions={menuActions}
      />
      <Form tabs={FormTabs} activeTab={activeTab} />
    </Box>
  );
};

/**
 * プラグイン設定画面のメインコンテンツ
 */
export const PluginContent: FC = () => {
  const { methods } = usePluginForm();

  return (
    <Suspense fallback={<FieldsLoadingFallback />}>
      <FormProvider {...methods}>
        <PluginContentForm />
      </FormProvider>
    </Suspense>
  );
};
