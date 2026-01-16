import { type FC, useCallback } from 'react';
import { useAtom, useAtomValue } from 'jotai';
import { FormProvider, useFormContext } from 'react-hook-form';
import { Box, Button } from '@mui/material';
import { activeTabIndexAtom, loadingAtom } from '@/config/states/plugin';
import { usePluginForm } from '@/config/hooks/use-plugin-form';
import { usePluginSubmit } from '@/config/hooks/use-plugin-submit';
import { useResetConfig } from '@/config/hooks/use-reset-config';
import { type PluginConfig } from '@/shared/config';
import { Header, Form } from '@kintone-plugin/ui';
import { FormTabs } from '@/config/components/features/FormTabs';

/**
 * 実際のフォーム内容とロジックを管理する内部コンポーネント
 */
const PluginContentForm: FC = () => {
  const { handleSubmit, formState } = useFormContext<PluginConfig>();
  const [activeTab, setActiveTab] = useAtom(activeTabIndexAtom);
  const loading = useAtomValue(loadingAtom);
  const resetConfig = useResetConfig();

  const { isDirty, isSubmitting } = formState;

  /** プラグイン一覧へ戻る処理 */
  const handleNavigateBack = useCallback(() => history.back(), []);

  /** タブ変更ハンドラ */
  const handleTabChange = (index: number) => {
    setActiveTab(index);
  };

  /** 送信処理の初期化 */
  const { onSubmit } = usePluginSubmit({
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
        onReset={resetConfig}
      />
      <Form tabs={FormTabs} activeTab={activeTab} />
    </Box>
  );
};

/**
 * プラグイン設定画面のメインコンテンツ
 * FormProvider を提供し、内部コンポーネントで RHF のコンテクストを利用可能にする
 */
export const PluginContent: FC = () => {
  const { methods } = usePluginForm();

  return (
    <FormProvider {...methods}>
      <PluginContentForm />
    </FormProvider>
  );
};
