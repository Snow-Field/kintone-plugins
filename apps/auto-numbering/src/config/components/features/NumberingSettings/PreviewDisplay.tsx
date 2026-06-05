import { type FC } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { Box, Paper, Typography, Alert } from '@mui/material';
import PreviewIcon from '@mui/icons-material/Preview';
import { type PluginConfig, type NumberingSetting } from '@/shared/config';
import { useNumberingPreview } from '@/config/hooks/useNumberingPreview';

type Props = {
  settingIndex: number;
};

/**
 * 採番プレビュー表示コンポーネント
 * リアルタイムで採番結果のプレビューを表示
 */
export const PreviewDisplay: FC<Props> = ({ settingIndex }) => {
  const { control } = useFormContext<PluginConfig>();

  // 採番設定全体を監視
  const setting = useWatch({
    control,
    name: `numberingSettings.${settingIndex}` as never,
  }) as unknown as NumberingSetting | undefined;

  // プレビューを生成
  const { value, error } = useNumberingPreview(setting);

  // エラー表示
  if (error) {
    return (
      <Box>
        <Alert severity='error' icon={<PreviewIcon fontSize='small' />} sx={{ py: 0.5 }}>
          <Typography variant='caption' fontWeight={500}>
            プレビューを生成できません: {error}
          </Typography>
        </Alert>
      </Box>
    );
  }

  // プレビュー値表示
  if (value) {
    return (
      <Box>
        <Paper
          variant='outlined'
          sx={{
            px: 2,
            py: 1.5,
            bgcolor: 'grey.50',
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
          }}
        >
          <PreviewIcon color='action' />
          <Box>
            <Typography variant='caption' color='text.secondary'>
              採番例
            </Typography>
            <Typography
              variant='h6'
              sx={{
                fontFamily: 'monospace',
                color: 'primary.main',
                fontWeight: 500,
                wordBreak: 'break-all',
              }}
            >
              {value}
            </Typography>
          </Box>
        </Paper>
      </Box>
    );
  }

  // デフォルト（未設定）表示
  return (
    <Box>
      <Alert severity='info' icon={<PreviewIcon fontSize='small' />} sx={{ py: 0.5 }}>
        <Typography variant='caption'>設定を入力するとプレビューが表示されます</Typography>
      </Alert>
    </Box>
  );
};
