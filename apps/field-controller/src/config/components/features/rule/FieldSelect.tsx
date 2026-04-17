import { type FC, useMemo } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { Autocomplete, TextField, Chip, Checkbox, Box, Typography } from '@mui/material';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import { useAppFields } from '@kintone-plugin/kintone-utils';
import { type PluginConfig } from '@/shared/config';
import type { KintoneFormFieldProperty } from '@kintone/rest-api-client';

/** 対象フィールドとして選択可能なフィールドタイプ */
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
] as const;

type FieldOption = {
  code: string;
  label: string;
  type: string;
};

type Props = {
  name: string;
  multiple?: boolean;
};

/**
 * kintone フィールド一覧から対象フィールドを選択する Autocomplete コンポーネント
 * - multiple=true のとき Selection indicators（チェックボックス）で選択状態を表示
 * - タイプでフィールド名・コードを絞り込み可能
 * - 標準のクリアボタン（×）で全解除
 */
export const FieldSelect: FC<Props> = ({ name, multiple = false }) => {
  const { control } = useFormContext<PluginConfig>();
  const { fields } = useAppFields(
    TARGET_FIELD_TYPES as unknown as Parameters<typeof useAppFields>[0]
  );

  // KintoneFormFieldProperty.OneOf[] → FieldOption[] に変換
  const options: FieldOption[] = useMemo(
    () =>
      (fields as KintoneFormFieldProperty.OneOf[]).map((f) => ({
        code: f.code,
        label: f.label,
        type: f.type,
      })),
    [fields]
  );

  return (
    <Controller
      name={name as never}
      control={control}
      render={({ field, fieldState: { error } }) => {
        if (multiple) {
          // 保存値（string[]）→ FieldOption[] に変換
          const fieldValue = Array.isArray(field.value) ? (field.value as string[]) : [];
          const selectedOptions = fieldValue
            .map((code) => options.find((o) => o.code === code))
            .filter((o): o is FieldOption => o !== undefined);

          return (
            <Autocomplete
              multiple
              options={options}
              value={selectedOptions}
              onChange={(_, newValue) => {
                // FieldOption[] → string[] に変換して保存
                field.onChange(newValue.map((o) => o.code));
              }}
              getOptionLabel={(option) => option.label}
              isOptionEqualToValue={(option, value) => option.code === value.code}
              disableCloseOnSelect
              size='small'
              filterOptions={(opts, { inputValue }) => {
                const lower = inputValue.toLowerCase();
                return opts.filter(
                  (o) =>
                    o.label.toLowerCase().includes(lower) || o.code.toLowerCase().includes(lower)
                );
              }}
              renderOption={(props, option, { selected }) => {
                const { key, ...rest } = props;
                return (
                  <li key={key} {...rest}>
                    <Checkbox
                      icon={<CheckBoxOutlineBlankIcon fontSize='small' />}
                      checkedIcon={<CheckBoxIcon fontSize='small' />}
                      checked={selected}
                      sx={{ mr: 1, p: 0 }}
                    />
                    <Box>
                      <Typography variant='body2'>{option.label}</Typography>
                      <Typography variant='caption' color='text.secondary'>
                        {option.code}
                      </Typography>
                    </Box>
                  </li>
                );
              }}
              renderValue={(value) =>
                value.map((option, index) => (
                  <Chip
                    key={option.code}
                    label={option.label}
                    size='small'
                    sx={{ mt: 0.5, mr: 0.5 }}
                    onDelete={() => {
                      const next = [...value];
                      next.splice(index, 1);
                      field.onChange(next.map((o) => o.code));
                    }}
                  />
                ))
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  label='対象フィールド'
                  size='small'
                  error={!!error}
                  helperText={error?.message}
                />
              )}
            />
          );
        }

        // single select
        const selectedOption =
          options.find((o) => o.code === (field.value as unknown as string)) ?? null;

        return (
          <Autocomplete
            options={options}
            value={selectedOption}
            onChange={(_, newValue) => {
              field.onChange(newValue?.code ?? '');
            }}
            getOptionLabel={(option) => option.label}
            isOptionEqualToValue={(option, value) => option.code === value.code}
            size='small'
            filterOptions={(opts, { inputValue }) => {
              const lower = inputValue.toLowerCase();
              return opts.filter(
                (o) => o.label.toLowerCase().includes(lower) || o.code.toLowerCase().includes(lower)
              );
            }}
            renderOption={(props, option) => {
              const { key, ...rest } = props;
              return (
                <li key={key} {...rest}>
                  <Box>
                    <Typography variant='body2'>{option.label}</Typography>
                    <Typography variant='caption' color='text.secondary'>
                      {option.code}
                    </Typography>
                  </Box>
                </li>
              );
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label='対象フィールド'
                size='small'
                error={!!error}
                helperText={error?.message}
              />
            )}
          />
        );
      }}
    />
  );
};
