import { type FC, useState } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { Box, Card, CardContent, Collapse, Divider, IconButton, Tooltip } from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DeleteIcon from '@mui/icons-material/Delete';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import type { AppFieldType } from '@kintone-plugin/kintone-utils';
import { FieldSelect } from '@kintone-plugin/plugin-shell';
import {
  FormAutocomplete,
  type FormAutocompleteOption,
  FormSwitch,
  FormTextField,
} from '@kintone-plugin/ui';
import type { PluginConfig } from '@/shared/config';
import { ConditionList } from './ConditionList';

/** 非表示・編集不可の対象として選べるフィールドの種類 */
const TARGET_FIELD_TYPES = [
  'SINGLE_LINE_TEXT',
  'MULTI_LINE_TEXT',
  'RICH_TEXT',
  'NUMBER',
  'CALC',
  'CHECK_BOX',
  'RADIO_BUTTON',
  'DROP_DOWN',
  'MULTI_SELECT',
  'DATE',
  'TIME',
  'DATETIME',
  'LINK',
  'USER_SELECT',
  'ORGANIZATION_SELECT',
  'GROUP_SELECT',
] as const satisfies readonly AppFieldType[];

type Props = {
  rulesPath: 'visibilityRules' | 'disableRules';
  ruleIndex: number;
  triggerOptions: readonly FormAutocompleteOption[];
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
  const { control } = useFormContext<PluginConfig>();
  const rulePath = `${rulesPath}.${ruleIndex}` as const;
  const enabled = useWatch({ control, name: `${rulePath}.enabled` });

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
            name={`${rulePath}.label`}
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
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
          <FormSwitch<PluginConfig>
            name={`${rulePath}.enabled`}
            label={enabled ? '有効' : '無効'}
            size='small'
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
          <FormAutocomplete<PluginConfig>
            name={`${rulePath}.block.triggers`}
            label='イベント'
            options={triggerOptions}
            multiple
            size='small'
          />

          <Divider />

          <FieldSelect<PluginConfig>
            name={`${rulePath}.targetFields`}
            label='対象フィールド'
            fieldTypes={TARGET_FIELD_TYPES}
            multiple
            size='small'
          />

          <Divider />

          <ConditionList rulesPath={rulesPath} ruleIndex={ruleIndex} />
        </CardContent>
      </Collapse>
    </Card>
  );
};
