import { type FC, useState } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import {
  Box,
  Card,
  CardContent,
  Collapse,
  Divider,
  IconButton,
  Tooltip,
  Typography,
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DeleteIcon from '@mui/icons-material/Delete';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { FieldSelect } from '@kintone-plugin/plugin-shell';
import { FormSwitch, FormTextField } from '@kintone-plugin/ui';
import type { PluginConfig } from '@/shared/config';
import { FormatPartsList } from './FormatPartsList';
import { PreviewDisplay } from './PreviewDisplay';
import { SerialConfigEditor } from './SerialConfigEditor';

/** 採番結果を書き込めるフィールドの種類 */
const RESULT_FIELD_TYPES = ['SINGLE_LINE_TEXT'] as const;

type Props = {
  settingIndex: number;
  onRemove: () => void;
  onDuplicate: () => void;
  isRemoveDisabled?: boolean;
};

/** カードの中の見出し */
const SectionTitle: FC<{ children: string }> = ({ children }) => (
  <Typography variant='subtitle2' sx={{ mb: 0.5, fontSize: '0.875rem' }}>
    {children}
  </Typography>
);

/**
 * 1採番設定単位の設定カード
 */
export const NumberingSettingCard: FC<Props> = ({
  settingIndex,
  onRemove,
  onDuplicate,
  isRemoveDisabled,
}) => {
  const { control } = useFormContext<PluginConfig>();
  const settingPath = `numberingSettings.${settingIndex}` as const;
  const enabled = useWatch({ control, name: `${settingPath}.enabled` });

  const [isExpanded, setIsExpanded] = useState(true);

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
          <FormTextField<PluginConfig>
            name={`${settingPath}.label`}
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
                borderBottom: '1px solid',
                borderColor: 'text.secondary',
              },
              '& .MuiInput-underline:after': {
                borderBottom: '1px solid',
                borderColor: 'text.secondary',
              },
            }}
          />
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <FormSwitch<PluginConfig>
            name={`${settingPath}.enabled`}
            label={enabled ? '有効' : '無効'}
            size='small'
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
          <Box>
            <SectionTitle>プレビュー</SectionTitle>
            <PreviewDisplay settingIndex={settingIndex} />
          </Box>

          <Divider textAlign='left' sx={{ mt: 1.5 }} />

          <Box sx={{ mt: 1, maxWidth: 300 }}>
            <SectionTitle>基本設定</SectionTitle>
            <FieldSelect<PluginConfig>
              name={`${settingPath}.resultFieldCode`}
              label='採番結果フィールド'
              placeholder='フィールドを選択'
              fieldTypes={RESULT_FIELD_TYPES}
              size='small'
            />
          </Box>

          <Divider textAlign='left' sx={{ mt: 1.5 }} />

          <Box sx={{ mt: 1 }}>
            <SectionTitle>フォーマットパーツ（最大3つ）</SectionTitle>
            <FormatPartsList settingIndex={settingIndex} />
          </Box>

          <Divider textAlign='left' sx={{ mt: 1.5 }} />

          <Box sx={{ mt: 1 }}>
            <SectionTitle>連番設定</SectionTitle>
            <SerialConfigEditor settingIndex={settingIndex} />
          </Box>
        </CardContent>
      </Collapse>
    </Card>
  );
};
