import { type FC, useMemo } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { Autocomplete, TextField, Box, Typography } from '@mui/material';
import { useAppFields } from '@kintone-plugin/kintone-utils';
import { type PluginConfig } from '@/shared/config';
import type { KintoneFormFieldProperty } from '@kintone/rest-api-client';

/** 採番結果フィールドとして選択可能なフィールドタイプ（文字列1行のみ） */
const RESULT_FIELD_TYPES = ['SINGLE_LINE_TEXT'] as const;

type FieldOption = {
  code: string;
  label: string;
  type: string;
};

type Props = {
  name: string;
};

/**
 * 採番結果を書き込むフィールドを選択する Autocomplete コンポーネント
 * 文字列（1行）フィールドのみ選択可能
 */
export const ResultFieldSelector: FC<Props> = ({ name }) => {
  const { control } = useFormContext<PluginConfig>();
  const { fields } = useAppFields(
    RESULT_FIELD_TYPES as unknown as Parameters<typeof useAppFields>[0]
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
                placeholder='フィールドを選択'
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
