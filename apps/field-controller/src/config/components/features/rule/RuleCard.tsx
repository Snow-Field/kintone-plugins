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
import { TriggerSelect } from './TriggerSelect';
import { ConditionList } from './ConditionList';
import { FieldSelect } from './FieldSelect';

type TriggerOption = {
  label: string;
  value: string;
};

type Props = {
  rulesPath: 'visibilityRules' | 'disableRules';
  ruleIndex: number;
  triggerOptions: TriggerOption[];
  onRemove: () => void;
  onDuplicate: () => void;
  isRemoveDisabled?: boolean;
};

/**
 * 1ルール単位の設定カード
 */
export const RuleCard: FC<Props> = ({
  rulesPath,
  ruleIndex,
  triggerOptions,
  onRemove,
  onDuplicate,
  isRemoveDisabled,
}) => {
  const { control, setValue, register } = useFormContext<PluginConfig>();
  const enabledPath = `${rulesPath}.${ruleIndex}.enabled` as never;
  const labelPath = `${rulesPath}.${ruleIndex}.label` as const;

  const enabled = useWatch({ control, name: enabledPath }) as unknown as boolean;
  const label = useWatch({ control, name: labelPath }) as unknown as string | undefined;

  const [isExpanded, setIsExpanded] = useState(true);

  const handleEnabledChange = (checked: boolean) => {
    setValue(enabledPath, checked as never, { shouldDirty: true });
  };

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
            placeholder={`設定 ${ruleIndex + 1}`}
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
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
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
          <Tooltip title='このルールを複製'>
            <IconButton size='small' onClick={onDuplicate}>
              <ContentCopyIcon fontSize='small' />
            </IconButton>
          </Tooltip>
          <Tooltip title='このルールを削除'>
            <span>
              <IconButton size='small' color='error' onClick={onRemove} disabled={isRemoveDisabled}>
                <DeleteIcon fontSize='small' />
              </IconButton>
            </span>
          </Tooltip>
        </Box>
      </Box>

      <Collapse in={isExpanded}>
        <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          {/* イベント選択 */}
          <TriggerSelect
            name={`${rulesPath}.${ruleIndex}.block.triggers`}
            options={triggerOptions}
          />

          <Divider />

          {/* 対象フィールド */}
          <FieldSelect name={`${rulesPath}.${ruleIndex}.targetFields`} multiple />

          <Divider />

          {/* 条件一覧 */}
          <ConditionList rulesPath={rulesPath} ruleIndex={ruleIndex} />
        </CardContent>
      </Collapse>
    </Card>
  );
};
