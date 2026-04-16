import { type FC, useMemo } from 'react';
import { Controller, useFormContext, useWatch } from 'react-hook-form';
import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  IconButton,
  Tooltip,
  Chip,
  FormHelperText,
  Autocomplete,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { useAppFields } from '@kintone-plugin/kintone-utils';
import { type PluginConfig, OPERATOR_TYPES } from '@/shared/config';
import { isOperatorCompatibleWithFieldType } from '@/shared/config/dynamicSchema';
import type { KintoneFormFieldProperty } from '@kintone/rest-api-client';

/** 条件フィールドとして選択可能なフィールドタイプ */
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
] as const;

/** 演算子の表示ラベル */
const OPERATOR_LABELS: Record<OPERATOR_TYPES, string> = {
  [OPERATOR_TYPES.EQUALS]: '等しい',
  [OPERATOR_TYPES.NOT_EQUALS]: '等しくない',
  [OPERATOR_TYPES.GREATER_THAN]: 'より大きい',
  [OPERATOR_TYPES.LESS_THAN]: 'より小さい',
  [OPERATOR_TYPES.GREATER_THAN_OR_EQUAL]: '以上',
  [OPERATOR_TYPES.LESS_THAN_OR_EQUAL]: '以下',
  [OPERATOR_TYPES.INCLUDES]: '含む',
  [OPERATOR_TYPES.NOT_INCLUDES]: '含まない',
};

/** 複数選択値を使うフィールドタイプ */
const MULTI_VALUE_FIELD_TYPES = new Set(['CHECK_BOX', 'MULTI_SELECT', 'RADIO_BUTTON', 'DROP_DOWN']);

type Props = {
  rulesPath: 'visibilityRules' | 'disableRules';
  ruleIndex: number;
  condIndex: number;
  onRemove: () => void;
  isRemoveDisabled?: boolean;
};

/**
 * 1条件行のフォームコンポーネント
 */
export const ConditionRow: FC<Props> = ({
  rulesPath,
  ruleIndex,
  condIndex,
  onRemove,
  isRemoveDisabled,
}) => {
  const { control, setValue } = useFormContext<PluginConfig>();
  const basePath = `${rulesPath}.${ruleIndex}.block.conditions.${condIndex}` as const;

  const { fields: allFields } = useAppFields(
    CONDITION_FIELD_TYPES as unknown as Parameters<typeof useAppFields>[0]
  );

  // 選択中のフィールドコードを監視
  const selectedFieldCode = useWatch({
    control,
    name: `${basePath}.field` as never,
  }) as unknown as string;
  const selectedOperator = useWatch({
    control,
    name: `${basePath}.operator` as never,
  }) as unknown as OPERATOR_TYPES;

  // 選択中フィールドのプロパティ
  const selectedFieldProp = useMemo(
    () => allFields.find((f) => f.code === selectedFieldCode),
    [allFields, selectedFieldCode]
  );

  // フィールドタイプに応じた演算子リスト
  const availableOperators = useMemo(() => {
    if (!selectedFieldProp) return Object.values(OPERATOR_TYPES);
    return Object.values(OPERATOR_TYPES).filter((op) =>
      isOperatorCompatibleWithFieldType(op, selectedFieldProp.type)
    );
  }, [selectedFieldProp]);

  // フィールド変更時に演算子・値をリセット
  const handleFieldChange = (code: string) => {
    setValue(`${basePath}.field` as never, code as never, { shouldDirty: true });
    setValue(`${basePath}.operator` as never, OPERATOR_TYPES.EQUALS as never, {
      shouldDirty: true,
    });
    setValue(`${basePath}.value` as never, '' as never, { shouldDirty: true });
  };

  // 演算子変更時に値をリセット
  const handleOperatorChange = (op: OPERATOR_TYPES) => {
    setValue(`${basePath}.operator` as never, op as never, { shouldDirty: true });
    setValue(`${basePath}.value` as never, '' as never, { shouldDirty: true });
  };

  // 値入力UIの種別を判定
  const isMultiValue =
    selectedFieldProp &&
    MULTI_VALUE_FIELD_TYPES.has(selectedFieldProp.type) &&
    (selectedOperator === OPERATOR_TYPES.INCLUDES ||
      selectedOperator === OPERATOR_TYPES.NOT_INCLUDES);

  // 選択肢を持つフィールドの選択肢リスト
  const fieldOptions = useMemo(() => {
    if (!selectedFieldProp) return [];
    const prop = selectedFieldProp as KintoneFormFieldProperty.OneOf;
    if ('options' in prop && prop.options) {
      return Object.values(prop.options).map((o) => o.label);
    }
    return [];
  }, [selectedFieldProp]);

  const hasOptions = fieldOptions.length > 0;

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
      {/* フィールド選択 */}
      <Controller
        name={`${basePath}.field` as never}
        control={control}
        render={({ field, fieldState: { error } }) => (
          <FormControl sx={{ flex: 2, minWidth: 160 }} size='small' error={!!error}>
            <InputLabel>フィールド</InputLabel>
            <Select
              value={(field.value as unknown as string) ?? ''}
              label='フィールド'
              onChange={(e) => handleFieldChange(e.target.value as string)}
            >
              {allFields.map((f) => (
                <MenuItem key={f.code} value={f.code}>
                  {f.label}
                </MenuItem>
              ))}
            </Select>
            {error && <FormHelperText>{error.message}</FormHelperText>}
          </FormControl>
        )}
      />

      {/* 演算子選択 */}
      <Controller
        name={`${basePath}.operator` as never}
        control={control}
        render={({ field, fieldState: { error } }) => (
          <FormControl sx={{ flex: 1.5, minWidth: 120 }} size='small' error={!!error}>
            <InputLabel>演算子</InputLabel>
            <Select
              value={(field.value as unknown as string) ?? OPERATOR_TYPES.EQUALS}
              label='演算子'
              onChange={(e) => handleOperatorChange(e.target.value as OPERATOR_TYPES)}
            >
              {availableOperators.map((op) => (
                <MenuItem key={op} value={op}>
                  {OPERATOR_LABELS[op]}
                </MenuItem>
              ))}
            </Select>
            {error && <FormHelperText>{error.message}</FormHelperText>}
          </FormControl>
        )}
      />

      {/* 値入力 */}
      <Controller
        name={`${basePath}.value` as never}
        control={control}
        render={({ field, fieldState: { error } }) => {
          if (isMultiValue && hasOptions) {
            // 複数選択 + 選択肢あり → Autocomplete (multiple)
            const currentValue = Array.isArray(field.value) ? field.value : [];
            return (
              <Autocomplete
                multiple
                options={fieldOptions}
                value={currentValue}
                onChange={(_, v) => field.onChange(v)}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => {
                    const { key, ...tagProps } = getTagProps({ index });
                    return <Chip key={key} label={option} size='small' {...tagProps} />;
                  })
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label='値'
                    size='small'
                    error={!!error}
                    helperText={error?.message}
                  />
                )}
                sx={{ flex: 2, minWidth: 160 }}
              />
            );
          }

          if (isMultiValue && !hasOptions) {
            // 複数選択 + 選択肢なし → Autocomplete (freeSolo multiple)
            const currentValue = Array.isArray(field.value) ? field.value : [];
            return (
              <Autocomplete
                multiple
                freeSolo
                options={[]}
                value={currentValue}
                onChange={(_, v) => field.onChange(v)}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => {
                    const { key, ...tagProps } = getTagProps({ index });
                    return <Chip key={key} label={option} size='small' {...tagProps} />;
                  })
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label='値'
                    size='small'
                    error={!!error}
                    helperText={error?.message}
                    placeholder='値を入力してEnter'
                  />
                )}
                sx={{ flex: 2, minWidth: 160 }}
              />
            );
          }

          if (hasOptions && !isMultiValue) {
            // 単一選択 + 選択肢あり → Select
            const currentValue = typeof field.value === 'string' ? field.value : '';
            return (
              <FormControl sx={{ flex: 2, minWidth: 160 }} size='small' error={!!error}>
                <InputLabel>値</InputLabel>
                <Select
                  value={currentValue}
                  onChange={(e) => field.onChange(e.target.value)}
                  label='値'
                >
                  {fieldOptions.map((opt) => (
                    <MenuItem key={opt} value={opt}>
                      {opt}
                    </MenuItem>
                  ))}
                </Select>
                {error && <FormHelperText>{error.message}</FormHelperText>}
              </FormControl>
            );
          }

          // デフォルト: テキスト入力
          const currentValue = typeof field.value === 'string' ? field.value : '';
          const inputType =
            selectedFieldProp?.type === 'NUMBER' || selectedFieldProp?.type === 'CALC'
              ? 'number'
              : selectedFieldProp?.type === 'DATE'
                ? 'date'
                : selectedFieldProp?.type === 'TIME'
                  ? 'time'
                  : selectedFieldProp?.type === 'DATETIME'
                    ? 'datetime-local'
                    : 'text';

          return (
            <TextField
              label='値'
              size='small'
              type={inputType}
              value={currentValue}
              onChange={(e) => field.onChange(e.target.value)}
              error={!!error}
              helperText={error?.message}
              InputLabelProps={
                ['date', 'time', 'datetime-local'].includes(inputType)
                  ? { shrink: true }
                  : undefined
              }
              sx={{ flex: 2, minWidth: 160 }}
            />
          );
        }}
      />

      {/* 削除ボタン */}
      <Tooltip title='この条件を削除'>
        <span>
          <IconButton
            size='small'
            color='error'
            onClick={onRemove}
            disabled={isRemoveDisabled}
            sx={{ mt: 0.5 }}
          >
            <DeleteIcon fontSize='small' />
          </IconButton>
        </span>
      </Tooltip>
    </Box>
  );
};
