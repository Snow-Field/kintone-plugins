import { type FC, useMemo } from 'react';
import { Controller, useFormContext, useWatch } from 'react-hook-form';
import {
  Box,
  TextField,
  FormControl,
  FormLabel,
  Select,
  MenuItem,
  FormHelperText,
  RadioGroup,
  FormControlLabel,
  Radio,
  Autocomplete,
  Typography,
} from '@mui/material';
import { useAppFields } from '@kintone-plugin/kintone-utils';
import { type PluginConfig } from '@/shared/config';
import { DATE_SOURCE, DATE_FORMATS } from '@/shared/constant/numbering';
import type { KintoneFormFieldProperty } from '@kintone/rest-api-client';

/** フィールドパーツで選択可能なフィールドタイプ */
const FIELD_PART_TYPES = [
  'SINGLE_LINE_TEXT',
  'NUMBER',
  'CALC',
  'RADIO_BUTTON',
  'DROP_DOWN',
  'DATE',
  'DATETIME',
] as const;

type FieldOption = {
  code: string;
  label: string;
  type: string;
};

type Props = {
  basePath: string;
  partIndex: number;
};

/** パーツタイプの選択肢 */
const PART_TYPE_OPTIONS = [
  { value: 'text', label: 'テキスト' },
  { value: 'field', label: 'フィールド' },
  { value: 'date', label: '日付' },
] as const;

/** 日付ソースの選択肢 */
const DATE_SOURCE_OPTIONS = [
  { value: DATE_SOURCE.NOW, label: '現在日時' },
  { value: DATE_SOURCE.CREATED_AT, label: 'レコード作成日時' },
] as const;

/** 日付フォーマットの選択肢 */
const DATE_FORMAT_OPTIONS = [
  { value: DATE_FORMATS.YYYYMMDD, label: 'YYYYMMDD（例: 20260530）' },
  { value: DATE_FORMATS.YYMMDD, label: 'YYMMDD（例: 260530）' },
  { value: DATE_FORMATS.YYYYMM, label: 'YYYYMM（例: 202605）' },
  { value: DATE_FORMATS.YYMM, label: 'YYMM（例: 2605）' },
  { value: DATE_FORMATS.YYYY, label: 'YYYY（例: 2026）' },
  { value: DATE_FORMATS.YY, label: 'YY（例: 26）' },
] as const;

/**
 * 個別フォーマットパーツの編集コンポーネント（インライン形式）
 * type に応じて異なる UI を横並びで表示
 */
export const FormatPartItem: FC<Props> = ({ basePath, partIndex }) => {
  const { control } = useFormContext<PluginConfig>();
  const { fields } = useAppFields(
    FIELD_PART_TYPES as unknown as Parameters<typeof useAppFields>[0]
  );

  // パーツタイプを監視
  const typePathName = `${basePath}.type` as const;
  const partType = useWatch({ control, name: typePathName as never }) as unknown as string;

  // KintoneFormFieldProperty.OneOf[] → FieldOption[] に変換
  const fieldOptions: FieldOption[] = useMemo(
    () =>
      (fields as KintoneFormFieldProperty.OneOf[]).map((f) => ({
        code: f.code,
        label: f.label,
        type: f.type,
      })),
    [fields]
  );

  return (
    <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start', flexWrap: 'wrap' }}>
      {/* パーツタイプ選択 */}
      <Controller
        name={typePathName as never}
        control={control}
        render={({ field, fieldState: { error } }) => (
          <Box sx={{ minWidth: 120, maxWidth: 150 }}>
            <FormControl fullWidth size='small' error={!!error}>
              <Select {...field} value={field.value as string}>
                {PART_TYPE_OPTIONS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {error && <FormHelperText error>{error.message}</FormHelperText>}
          </Box>
        )}
      />

      {/* type: 'text' の場合 */}
      {partType === 'text' && (
        <Controller
          name={`${basePath}.value` as never}
          control={control}
          render={({ field, fieldState: { error } }) => (
            <Box sx={{ flex: 1, minWidth: 200, maxWidth: 400 }}>
              <TextField
                {...field}
                placeholder='固定文字列を入力'
                size='small'
                fullWidth
                error={!!error}
              />
              {error && <FormHelperText error>{error.message}</FormHelperText>}
            </Box>
          )}
        />
      )}

      {/* type: 'field' の場合 */}
      {partType === 'field' && (
        <Controller
          name={`${basePath}.fieldCode` as never}
          control={control}
          render={({ field, fieldState: { error } }) => {
            const selectedOption =
              fieldOptions.find((o) => o.code === (field.value as unknown as string)) ?? null;

            return (
              <Box sx={{ flex: 1, minWidth: 200, maxWidth: 400 }}>
                <Autocomplete
                  options={fieldOptions}
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
                      (o) =>
                        o.label.toLowerCase().includes(lower) ||
                        o.code.toLowerCase().includes(lower)
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
                    />
                  )}
                />
                {error && <FormHelperText error>{error.message}</FormHelperText>}
              </Box>
            );
          }}
        />
      )}

      {/* type: 'date' の場合 */}
      {partType === 'date' && (
        <>
          {/* 日付フォーマット */}
          <Controller
            name={`${basePath}.format` as never}
            control={control}
            render={({ field, fieldState: { error } }) => (
              <Box sx={{ minWidth: 150, maxWidth: 200 }}>
                <FormControl fullWidth size='small' error={!!error}>
                  <Select
                    {...field}
                    value={field.value as string}
                    displayEmpty
                    renderValue={(selected) => {
                      if (!selected) {
                        return (
                          <Typography variant='body2' color='text.secondary'>
                            フォーマットを選択
                          </Typography>
                        );
                      }
                      const option = DATE_FORMAT_OPTIONS.find((o) => o.value === selected);
                      return option?.label || selected;
                    }}
                  >
                    {DATE_FORMAT_OPTIONS.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                {error && <FormHelperText error>{error.message}</FormHelperText>}
              </Box>
            )}
          />

          {/* 日付ソース */}
          <Controller
            name={`${basePath}.source` as never}
            control={control}
            render={({ field, fieldState: { error } }) => (
              <Box sx={{ minWidth: 150, maxWidth: 200 }}>
                <FormControl fullWidth size='small' error={!!error}>
                  <Select
                    {...field}
                    value={field.value as string}
                    displayEmpty
                    renderValue={(selected) => {
                      if (!selected) {
                        return (
                          <Typography variant='body2' color='text.secondary'>
                            日付ソースを選択
                          </Typography>
                        );
                      }
                      const option = DATE_SOURCE_OPTIONS.find((o) => o.value === selected);
                      return option?.label || selected;
                    }}
                  >
                    {DATE_SOURCE_OPTIONS.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                {error && <FormHelperText error>{error.message}</FormHelperText>}
              </Box>
            )}
          />
        </>
      )}
    </Box>
  );
};
