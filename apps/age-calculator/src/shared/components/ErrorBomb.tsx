import { type FC, useState } from 'react';
import { Box, Button, Typography } from '@mui/material';

/**
 * 【デバッグ用】ErrorBoundaryの動作を確認するためのコンポーネント
 * クリックするとレンダリング中にエラーをスローします
 */
export const ErrorBomb: FC = () => {
  const [shouldThrow, setShouldThrow] = useState(false);

  if (shouldThrow) {
    throw new Error('ErrorBoundary動作確認用の意図的なエラーです。');
  }

  return (
    <Box
      sx={{
        p: 2,
        m: 2,
        border: '2px dashed #f44336',
        borderRadius: 2,
        bgcolor: 'rgba(244, 67, 54, 0.05)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <Box>
        <Typography variant="subtitle2" sx={{ color: '#d32f2f', fontWeight: 'bold' }}>
          デバッグツール: ErrorBoundary テスト
        </Typography>
        <Typography variant="caption" color="text.secondary">
          下のボタンを押すとレンダリングエラーを発生させます。
        </Typography>
      </Box>
      <Button
        variant="contained"
        color="error"
        size="small"
        onClick={() => setShouldThrow(true)}
        sx={{ ml: 2 }}
      >
        エラーを発生させる
      </Button>
    </Box>
  );
};
