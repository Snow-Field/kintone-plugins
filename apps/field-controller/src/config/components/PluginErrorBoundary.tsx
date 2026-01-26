import React, { type FC, useState } from 'react';
import { ErrorBoundary, type FallbackProps } from 'react-error-boundary';
import { Alert, AlertTitle, Button, Typography, Box, Stack, Paper } from '@mui/material';
import { GeometryLoader } from '@kintone-plugin/ui';

const ErrorFallback: FC<FallbackProps> = ({ error, resetErrorBoundary }) => {
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetry = () => {
    setIsRetrying(true);
    setTimeout(() => {
      resetErrorBoundary();
      setIsRetrying(false);
    }, 1500);
  };

  if (isRetrying) {
    return <GeometryLoader label='再試行中...' />;
  }

  return (
    <Box sx={{ p: 2 }}>
      <Alert severity='error' variant='outlined'>
        <AlertTitle sx={{ fontWeight: 'bold' }}>エラーが発生しました: {error.message}</AlertTitle>

        <Paper elevation={0} sx={{ mt: 2, p: 2, bgcolor: 'rgba(211, 47, 47, 0.04)' }}>
          <Typography variant='subtitle1' sx={{ fontWeight: 'bold', mb: 1 }}>
            解決方法
          </Typography>

          <Stack spacing={3} component='ol' sx={{ pl: 2, m: 0 }}>
            <Box component='li'>
              <Typography variant='subtitle2' sx={{ fontWeight: 'bold' }}>
                処理をリトライ
              </Typography>
              <Typography variant='body2' sx={{ mb: 1 }}>
                一時的な不具合の可能性があります。ボタンをクリックして再実行してください。
              </Typography>
              <Button size='small' variant='contained' color='error' onClick={handleRetry}>
                リトライ
              </Button>
            </Box>

            <Box component='li'>
              <Typography variant='subtitle2' sx={{ fontWeight: 'bold' }}>
                プラグイン設定を更新
              </Typography>
              <Typography variant='body2'>
                アプリ設定からこのプラグインの設定を開き、再度「保存」した上でアプリを更新してください。
              </Typography>
            </Box>
          </Stack>
        </Paper>
      </Alert>
    </Box>
  );
};

export const PluginErrorBoundary: FC<{ children: React.ReactNode }> = ({ children }) => {
  return <ErrorBoundary FallbackComponent={ErrorFallback}>{children}</ErrorBoundary>;
};
