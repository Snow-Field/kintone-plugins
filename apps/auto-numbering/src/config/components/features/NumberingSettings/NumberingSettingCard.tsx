import { type FC } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import {
  Box,
  Card,
  CardContent,
  Divider,
  FormControlLabel,
  Switch,
  Typography,
  IconButton,
  Tooltip,
  TextField,
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DeleteIcon from '@mui/icons-material/Delete';
import { type PluginConfig } from '@/shared/config';
import { ResultFieldSelector } from './ResultFieldSelector';
import { ConnectorSelector } from './ConnectorSelector';
import { SerialConfigEditor } from './SerialConfigEditor';
import { FormatPartsList } from './FormatPartsList';
import { PreviewDisplay } from './PreviewDisplay';

type Props = {
  settingIndex: number;
  onRemove: () => void;
  onDuplicate: () => void;
  isRemoveDisabled?: boolean;
};

/**
 * 1採番設定単位の設定カード
 */
export const NumberingSettingCard: FC<Props> = ({
  settingIndex,
  onRemove,
  onDuplicate,
  isRemoveDisabled,
}) => {
  const { control, setValue, register } = useFormContext<PluginConfig>();
  const enabledPath = `numberingSettings.${settingIndex}.enabled` as const;
  const labelPath = `numberingSettings.${settingIndex}.label` as const;

  const enabled = useWatch({ control, name: enabledPath }) as unknown as boolean;
  const label = useWatch({ control, name: labelPath }) as unknown as string | undefined;

  const handleEnabledChange = (checked: boolean) => {
    setValue(enabledPath, checked as never, { shouldDirty: true });
  };

  // 表示名（未入力時は「設定 N」）
  const displayLabel = label || `設定 ${settingIndex + 1}`;

  return (
    <Card
      variant='outlined'
      sx={{
        opacity: enabled ? 1 : 0.55,
        transition: 'opacity 0.2s ease',
        width: '100%',
      }}
    >
      {/* カードヘッダー */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 2,
          py: 1,
          bgcolor: 'grey.50',
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <FormControlLabel
            control={
              <Switch
                checked={!!enabled}
                onChange={(e) => handleEnabledChange(e.target.checked)}
                size='small'
                color='primary'
              />
            }
            label={
              <Typography variant='body2' fontWeight={500}>
                {enabled ? '有効' : '無効'}
              </Typography>
            }
          />
          <Typography variant='body2' color='text.secondary'>
            {displayLabel}
          </Typography>
        </Box>
        <Box>
          <Tooltip title='この設定を複製'>
            <IconButton size='small' onClick={onDuplicate}>
              <ContentCopyIcon fontSize='small' />
            </IconButton>
          </Tooltip>
          <Tooltip title='この設定を削除'>
            <span>
              <IconButton size='small' color='error' onClick={onRemove} disabled={isRemoveDisabled}>
                <DeleteIcon fontSize='small' />
              </IconButton>
            </span>
          </Tooltip>
        </Box>
      </Box>

      <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        {/* 表示名 */}
        <Box>
          <Typography variant='subtitle2' gutterBottom>
            表示名（オプション）
          </Typography>
          <TextField
            {...register(labelPath)}
            fullWidth
            size='small'
            placeholder={`設定 ${settingIndex + 1}`}
            helperText='この設定を識別するための名前を入力できます（例: 営業部採番）'
          />
        </Box>

        <Divider />

        {/* 採番結果フィールド */}
        <Box>
          <Typography variant='subtitle2' gutterBottom>
            採番結果フィールド
          </Typography>
          <ResultFieldSelector name={`numberingSettings.${settingIndex}.resultFieldCode`} />
        </Box>

        <Divider />

        {/* フォーマットパーツ */}
        <Box>
          <Typography variant='subtitle2' gutterBottom>
            フォーマットパーツ
          </Typography>
          <FormatPartsList basePath={`numberingSettings.${settingIndex}`} />
        </Box>

        <Divider />

        {/* 区切り文字 */}
        <Box>
          <ConnectorSelector name={`numberingSettings.${settingIndex}.connector`} />
        </Box>

        <Divider />

        {/* 連番設定 */}
        <Box>
          <Typography variant='subtitle2' gutterBottom>
            連番設定
          </Typography>
          <SerialConfigEditor basePath={`numberingSettings.${settingIndex}.serialConfig`} />
        </Box>

        <Divider />

        {/* プレビュー */}
        <Box>
          <Typography variant='subtitle2' gutterBottom>
            プレビュー
          </Typography>
          <PreviewDisplay settingIndex={settingIndex} />
        </Box>
      </CardContent>
    </Card>
  );
};
