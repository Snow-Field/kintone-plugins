import { type FC, useMemo } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { Box, IconButton, Tooltip } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { type AppFieldType, useAppFields } from '@kintone-plugin/kintone-utils';
import { FieldSelect } from '@kintone-plugin/plugin-shell';
import { FormAutocomplete, FormSelect, FormTextField } from '@kintone-plugin/ui';
import { getCompatibleOperators, OPERATOR_TYPES, type PluginConfig } from '@/shared/config';

/** 条件に使えるフィールドの種類 */
const CONDITION_FIELD_TYPES = [
  'SINGLE_LINE_TEXT',
  'MULTI_LINE_TEXT',
  'NUMBER',
  'CALC',
  'CHECK_BOX',
  'RADIO_BUTTON',
  'DROP_DOWN',
  'MULTI_SELECT',
  'DATE',
  'TIME',
  'DATETIME',
] as const satisfies readonly AppFieldType[];

/** 演算子の表示ラベル */
const OPERATOR_LABELS: Record<OPERATOR_TYPES, string> = {
  [OPERATOR_TYPES.EQUALS]: '= (等しい)',
  [OPERATOR_TYPES.NOT_EQUALS]: '≠ (等しくない)',
  [OPERATOR_TYPES.GREATER_THAN]: '> (より大きい)',
  [OPERATOR_TYPES.LESS_THAN]: '< (より小さい)',
  [OPERATOR_TYPES.GREATER_THAN_OR_EQUAL]: '≧ (以上)',
  [OPERATOR_TYPES.LESS_THAN_OR_EQUAL]: '≦ (以下)',
  [OPERATOR_TYPES.INCLUDES]: '含む',
  [OPERATOR_TYPES.NOT_INCLUDES]: '含まない',
};

/** 値を複数選べるフィールドの種類（選択肢を持つフィールド） */
const MULTI_VALUE_FIELD_TYPES = new Set<AppFieldType>([
  'CHECK_BOX',
  'MULTI_SELECT',
  'RADIO_BUTTON',
  'DROP_DOWN',
]);

/** フィールドの種類に合う入力欄の type */
const resolveInputType = (fieldType: AppFieldType | undefined): string => {
  if (fieldType === 'NUMBER' || fieldType === 'CALC') return 'number';
  if (fieldType === 'DATE') return 'date';
  if (fieldType === 'TIME') return 'time';
  if (fieldType === 'DATETIME') return 'datetime-local';
  return 'text';
};

type Props = {
  rulesPath: 'visibilityRules' | 'disableRules';
  ruleIndex: number;
  condIndex: number;
  onInsert: () => void;
  onRemove: () => void;
};

/**
 * 1条件行のフォームコンポーネント
 */
export const ConditionRow: FC<Props> = ({
  rulesPath,
  ruleIndex,
  condIndex,
  onInsert,
  onRemove,
}) => {
  const { control, setValue } = useFormContext<PluginConfig>();
  const basePath = `${rulesPath}.${ruleIndex}.block.conditions.${condIndex}` as const;

  const { fields } = useAppFields(CONDITION_FIELD_TYPES);
  const selectedFieldCode = useWatch({ control, name: `${basePath}.field` });
  const selectedOperator = useWatch({ control, name: `${basePath}.operator` });
  const selectedField = fields.find((f) => f.code === selectedFieldCode);

  // フィールドの種類に合う演算子だけを出す
  const operatorOptions = useMemo(
    () =>
      (selectedField
        ? getCompatibleOperators(selectedField.type)
        : Object.values(OPERATOR_TYPES)
      ).map((op) => ({ value: op, label: OPERATOR_LABELS[op] })),
    [selectedField]
  );

  // 選択肢を持つフィールドの選択肢
  const valueOptions = useMemo(() => {
    if (!selectedField || !('options' in selectedField)) return [];
    return Object.values(selectedField.options).map((o) => ({ value: o.label, label: o.label }));
  }, [selectedField]);

  // フィールドを変えたら、そのフィールドで使える最初の演算子にし、値を空にする
  const handleFieldChange = (code: string) => {
    const field = fields.find((f) => f.code === code);
    const [operator = OPERATOR_TYPES.EQUALS] = field ? getCompatibleOperators(field.type) : [];
    setValue(`${basePath}.operator`, operator, { shouldDirty: true });
    setValue(`${basePath}.value`, '', { shouldDirty: true });
  };

  const isMultiValue =
    selectedField !== undefined &&
    MULTI_VALUE_FIELD_TYPES.has(selectedField.type) &&
    (selectedOperator === OPERATOR_TYPES.INCLUDES ||
      selectedOperator === OPERATOR_TYPES.NOT_INCLUDES);
  const hasValueOptions = valueOptions.length > 0;
  const inputType = resolveInputType(selectedField?.type);
  const valuePath = `${basePath}.value` as const;

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 1,
        width: '100%',
        flexWrap: { xs: 'wrap', md: 'nowrap' },
      }}
    >
      <FieldSelect<PluginConfig>
        name={`${basePath}.field`}
        label='フィールド'
        fieldTypes={CONDITION_FIELD_TYPES}
        onValueChange={(value) => {
          if (typeof value === 'string') handleFieldChange(value);
        }}
        size='small'
        sx={{ flex: 2, minWidth: 160 }}
      />

      <FormSelect<PluginConfig>
        name={`${basePath}.operator`}
        label='演算子'
        options={operatorOptions}
        // 演算子を変えたら、入力の形が変わることがあるので値を空にする
        onValueChange={() => setValue(valuePath, '', { shouldDirty: true })}
        size='small'
        sx={{ flex: 1.5, minWidth: 120 }}
      />

      {isMultiValue && hasValueOptions ? (
        <FormAutocomplete<PluginConfig>
          name={valuePath}
          label='値'
          options={valueOptions}
          multiple
          size='small'
          sx={{ flex: 2, minWidth: 160 }}
        />
      ) : hasValueOptions ? (
        <FormSelect<PluginConfig>
          name={valuePath}
          label='値'
          options={valueOptions}
          size='small'
          sx={{ flex: 2, minWidth: 160 }}
        />
      ) : (
        <FormTextField<PluginConfig>
          name={valuePath}
          label='値'
          size='small'
          type={inputType}
          slotProps={inputType === 'text' ? undefined : { inputLabel: { shrink: true } }}
          sx={{ flex: 2, minWidth: 160 }}
        />
      )}

      <Box sx={{ display: 'flex', mt: 0.5, flexShrink: 0 }}>
        <Tooltip title='この行の下に条件を追加'>
          <IconButton size='small' onClick={onInsert}>
            <AddIcon fontSize='small' />
          </IconButton>
        </Tooltip>
        <Tooltip title='この条件を削除'>
          <IconButton size='small' color='error' onClick={onRemove}>
            <DeleteIcon fontSize='small' />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );
};
