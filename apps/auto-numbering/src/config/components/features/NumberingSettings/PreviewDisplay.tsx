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

  return (
    <Box>
      {error ? (
        <Alert severity='error' icon={<PreviewIcon />}>
          <Typography variant='body2' fontWeight={500}>
            プレビューを生成できません
          </Typography>
          <Typography variant='caption'>{error}</Typography>
        </Alert>
      ) : value ? (
        <Paper
          variant='outlined'
          sx={{
            p: 2,
            bgcolor: 'grey.50',
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          }}
        >
          <PreviewIcon color='action' />
          <Box>
            <Typography variant='caption' color='text.secondary' display='block'>
              採番例
            </Typography>
            <Typography
              variant='h6'
              sx={{
                fontFamily: 'monospace',
                color: 'primary.main',
                wordBreak: 'break-all',
              }}
            >
              {value}
            </Typography>
          </Box>
        </Paper>
      ) : (
        <Alert severity='info' icon={<PreviewIcon />}>
          <Typography variant='body2'>設定を入力するとプレビューが表示されます</Typography>
        </Alert>
      )}

      {/* 説明 */}
      <Typography variant='caption' color='text.secondary' sx={{ mt: 1, display: 'block' }}>
        ※ フィールドパーツはサンプル値で表示されます。実際の採番時はレコードの値が使用されます。
      </Typography>
    </Box>
  );
};
