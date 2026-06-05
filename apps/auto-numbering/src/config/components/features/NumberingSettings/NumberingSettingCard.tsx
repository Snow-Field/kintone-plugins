import { type FC, useState } from 'react';
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
  Collapse,
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DeleteIcon from '@mui/icons-material/Delete';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { type PluginConfig } from '@/shared/config';
import { ResultFieldSelector } from './ResultFieldSelector';
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

  const [isExpanded, setIsExpanded] = useState(true);

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
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
          <Tooltip title={isExpanded ? '閉じる' : '開く'}>
            <IconButton size='small' onClick={() => setIsExpanded(!isExpanded)}>
              {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </Tooltip>
          <TextField
            {...register(labelPath)}
            size='small'
            placeholder={`設定 ${settingIndex + 1}`}
            variant='standard'
            sx={{
              flex: 1,
              maxWidth: 300,
              '& .MuiInput-underline:before': {
                borderBottom: 'none',
              },
              '& .MuiInput-underline:hover:not(.Mui-disabled):before': {
                borderBottom: '1px solid rgba(0, 0, 0, 0.42)',
              },
              '& .MuiInput-underline:after': {
                borderBottom: '1px solid rgba(0, 0, 0, 0.42)',
              },
            }}
          />
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
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

      <Collapse in={isExpanded}>
        <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, py: 2 }}>
          {/* プレビュー */}
          <Box>
            <Typography variant='subtitle2' sx={{ mb: 0.5, fontSize: '0.875rem' }}>
              プレビュー
            </Typography>
            <PreviewDisplay settingIndex={settingIndex} />
          </Box>

          <Divider textAlign='left' sx={{ mt: 1.5 }} />

          {/* 基本設定 */}
          <Box sx={{ mt: 1 }}>
            <Typography variant='subtitle2' sx={{ mb: 0.5, fontSize: '0.875rem' }}>
              基本設定
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, maxWidth: 300 }}>
              <Typography variant='body2' sx={{ fontSize: '0.875rem' }}>
                採番結果フィールド
              </Typography>
              <ResultFieldSelector name={`numberingSettings.${settingIndex}.resultFieldCode`} />
            </Box>
          </Box>

          <Divider textAlign='left' sx={{ mt: 1.5 }} />

          {/* フォーマットパーツ */}
          <Box sx={{ mt: 1 }}>
            <Typography variant='subtitle2' sx={{ mb: 0.5, fontSize: '0.875rem' }}>
              フォーマットパーツ（最大3つ）
            </Typography>
            <FormatPartsList basePath={`numberingSettings.${settingIndex}`} />
          </Box>

          <Divider textAlign='left' sx={{ mt: 1.5 }} />

          {/* 連番設定 */}
          <Box sx={{ mt: 1 }}>
            <Typography variant='subtitle2' sx={{ mb: 0.5, fontSize: '0.875rem' }}>
              連番設定
            </Typography>
            <SerialConfigEditor basePath={`numberingSettings.${settingIndex}.serialConfig`} />
          </Box>
        </CardContent>
      </Collapse>
    </Card>
  );
};
