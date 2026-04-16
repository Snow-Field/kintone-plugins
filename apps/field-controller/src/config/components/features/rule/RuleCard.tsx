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
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DeleteIcon from '@mui/icons-material/Delete';
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
  const { control, setValue } = useFormContext<PluginConfig>();
  const enabledPath = `${rulesPath}.${ruleIndex}.enabled` as never;
  const enabled = useWatch({ control, name: enabledPath }) as unknown as boolean;

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
        <Box>
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

      <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        {/* イベント選択 */}
        <TriggerSelect name={`${rulesPath}.${ruleIndex}.block.triggers`} options={triggerOptions} />

        <Divider />

        {/* 対象フィールド */}
        <FieldSelect name={`${rulesPath}.${ruleIndex}.targetFields`} multiple />

        <Divider />

        {/* 条件一覧 */}
        <ConditionList rulesPath={rulesPath} ruleIndex={ruleIndex} />
      </CardContent>
    </Card>
  );
};
