import { type FC } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { Box, Button, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { type PluginConfig } from '@/shared/config';
import { useConditionActions } from '@/config/hooks/useConditionActions';
import { ConditionRow } from './ConditionRow';

type Props = {
  rulesPath: 'visibilityRules' | 'disableRules';
  ruleIndex: number;
};

/**
 * 条件一覧コンポーネント（条件行の追加・削除・AND/OR ロジック切り替え）
 */
export const ConditionList: FC<Props> = ({ rulesPath, ruleIndex }) => {
  const { setValue, control } = useFormContext<PluginConfig>();
  const { appendCondition, removeCondition } = useConditionActions(rulesPath);

  const conditions = useWatch({
    control,
    name: `${rulesPath}.${ruleIndex}.block.conditions` as never,
  }) as unknown as PluginConfig['visibilityRules'][number]['block']['conditions'];

  const logic = useWatch({
    control,
    name: `${rulesPath}.${ruleIndex}.block.logic` as never,
  }) as unknown as 'AND' | 'OR';

  const handleLogicChange = (_: React.MouseEvent<HTMLElement>, value: 'AND' | 'OR' | null) => {
    if (value !== null) {
      setValue(`${rulesPath}.${ruleIndex}.block.logic` as never, value as never, {
        shouldDirty: true,
      });
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant='body2' color='text.secondary' fontWeight={500}>
          条件
        </Typography>
        {conditions && conditions.length > 1 && (
          <ToggleButtonGroup
            value={logic}
            exclusive
            onChange={handleLogicChange}
            size='small'
            color='primary'
          >
            <ToggleButton value='AND'>AND</ToggleButton>
            <ToggleButton value='OR'>OR</ToggleButton>
          </ToggleButtonGroup>
        )}
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {conditions && conditions.length > 0 ? (
          conditions.map((_, condIndex) => (
            <ConditionRow
              key={condIndex}
              rulesPath={rulesPath}
              ruleIndex={ruleIndex}
              condIndex={condIndex}
              onRemove={() => removeCondition(ruleIndex, condIndex)}
              isRemoveDisabled={conditions.length <= 1}
            />
          ))
        ) : (
          <Typography variant='body2' color='text.disabled' sx={{ py: 1 }}>
            すべてのレコード
          </Typography>
        )}
      </Box>

      <Button
        variant='outlined'
        size='small'
        startIcon={<AddIcon />}
        onClick={() => appendCondition(ruleIndex)}
        sx={{ mt: 1, borderStyle: 'dashed' }}
      >
        条件を追加
      </Button>
    </Box>
  );
};
