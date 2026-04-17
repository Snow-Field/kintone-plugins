import { type FC } from 'react';
import { useFormContext, useFieldArray, useWatch } from 'react-hook-form';
import {
  Box,
  IconButton,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ClearAllIcon from '@mui/icons-material/ClearAll';
import { type PluginConfig } from '@/shared/config';
import { createDefaultCondition } from '@/config/hooks/useConditionActions';
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

  const { fields, append, insert, remove, replace } = useFieldArray({
    control,
    name: `${rulesPath}.${ruleIndex}.block.conditions` as never,
  });

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

  const hasConditions = fields.length > 0;

  return (
    <Box>
      {/* ヘッダー行 */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant='body2' color='text.secondary' fontWeight={500}>
            条件
          </Typography>
          {fields.length > 1 && (
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

        {/* 右上ボタン群 */}
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {/* 条件を追加ボタン — 常に右上に表示 */}
          <Tooltip title='条件を追加'>
            <IconButton size='small' onClick={() => append(createDefaultCondition() as never)}>
              <AddIcon fontSize='small' />
            </IconButton>
          </Tooltip>

          {/* 全クリアボタン — 条件が1件以上あるときのみ表示 */}
          {hasConditions && (
            <Tooltip title='すべての条件をクリア'>
              <IconButton size='small' color='error' onClick={() => replace([] as never)}>
                <ClearAllIcon fontSize='small' />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Box>

      {/* 条件行リスト */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {hasConditions ? (
          fields.map((fieldItem, condIndex) => (
            <ConditionRow
              key={fieldItem.id}
              rulesPath={rulesPath}
              ruleIndex={ruleIndex}
              condIndex={condIndex}
              onInsert={() => insert(condIndex + 1, createDefaultCondition() as never)}
              onRemove={() => remove(condIndex)}
            />
          ))
        ) : (
          <Typography variant='body2' color='text.disabled' sx={{ py: 1 }}>
            すべてのレコード
          </Typography>
        )}
      </Box>
    </Box>
  );
};
