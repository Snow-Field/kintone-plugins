import { type FC, useMemo } from 'react';
import { Controller, useFormContext, useWatch } from 'react-hook-form';
import {
  Box,
  TextField,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Select,
  MenuItem,
  FormHelperText,
  Autocomplete,
  Typography,
} from '@mui/material';
import { useAppFields } from '@kintone-plugin/kintone-utils';
import { type PluginConfig } from '@/shared/config';
import { RESET_TIMING } from '@/shared/constant/numbering';
import type { KintoneFormFieldProperty } from '@kintone/rest-api-client';

/** 連番管理フィールドとして選択可能なフィールドタイプ（数値のみ） */
const SERIAL_FIELD_TYPES = ['NUMBER'] as const;

type FieldOption = {
  code: string;
  label: string;
  type: string;
};

type Props = {
  basePath: string;
};

/** リセットタイミングの選択肢 */
const RESET_TIMING_OPTIONS = [
  { value: RESET_TIMING.NONE, label: 'なし（全期間で連番）' },
  { value: RESET_TIMING.YEARLY, label: '年次リセット' },
  { value: RESET_TIMING.MONTHLY, label: '月次リセット' },
  { value: RESET_TIMING.DAILY, label: '日次リセット' },
] as const;

/** 連番位置の選択肢 */
const POSITION_OPTIONS = [
  { value: 'prefix', label: '先頭', example: '00001-営業部-26' },
  { value: 'suffix', label: '末尾', example: '営業部-26-00001' },
] as const;

/**
 * 連番設定を編集するコンポーネント
 */
export const SerialConfigEditor: FC<Props> = ({ basePath }) => {
  const { control } = useFormContext<PluginConfig>();
  const { fields } = useAppFields(
    SERIAL_FIELD_TYPES as unknown as Parameters<typeof useAppFields>[0]
  );

  // resetTiming の値を監視
  const resetTimingPath = `${basePath}.resetTiming` as const;
  const resetTiming = useWatch({ control, name: resetTimingPath as never }) as unknown as string;

  // KintoneFormFieldProperty.OneOf[] → FieldOption[] に変換
  const serialFieldOptions: FieldOption[] = useMemo(
    () =>
      (fields as KintoneFormFieldProperty.OneOf[]).map((f) => ({
        code: f.code,
        label: f.label,
        type: f.type,
      })),
    [fields]
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* 初期値 */}
      <Controller
        name={`${basePath}.initialValue` as never}
        control={control}
        render={({ field, fieldState: { error } }) => (
          <TextField
            {...field}
            type='number'
            label='初期値'
            size='small'
            slotProps={{
              htmlInput: { min: 1 },
            }}
            error={!!error}
            helperText={error?.message || '連番の開始値を指定します'}
            sx={{ maxWidth: 200 }}
          />
        )}
      />

      {/* ゼロ埋め桁数 */}
      <Controller
        name={`${basePath}.digit` as never}
        control={control}
        render={({ field, fieldState: { error } }) => (
          <TextField
            {...field}
            type='number'
            label='ゼロ埋め桁数'
            size='small'
            slotProps={{
              htmlInput: { min: 1, max: 10 },
            }}
            error={!!error}
            helperText={error?.message || '連番をゼロ埋めする桁数（1〜10）'}
            sx={{ maxWidth: 200 }}
          />
        )}
      />

      {/* 連番位置 */}
      <Controller
        name={`${basePath}.position` as never}
        control={control}
        render={({ field, fieldState: { error } }) => (
          <FormControl component='fieldset' error={!!error}>
            <FormLabel component='legend'>連番位置</FormLabel>
            <RadioGroup {...field} value={field.value as string}>
              {POSITION_OPTIONS.map((option) => (
                <FormControlLabel
                  key={option.value}
                  value={option.value}
                  control={<Radio size='small' />}
                  label={
                    <span>
                      {option.label}
                      <span style={{ marginLeft: 8, color: '#666', fontSize: '0.875rem' }}>
                        例: {option.example}
                      </span>
                    </span>
                  }
                />
              ))}
            </RadioGroup>
            {error && <FormHelperText>{error.message}</FormHelperText>}
          </FormControl>
        )}
      />

      {/* リセットタイミング */}
      <Controller
        name={resetTimingPath as never}
        control={control}
        render={({ field, fieldState: { error } }) => (
          <FormControl fullWidth size='small' error={!!error}>
            <FormLabel>リセットタイミング</FormLabel>
            <Select {...field} value={field.value as string}>
              {RESET_TIMING_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
            {error && <FormHelperText>{error.message}</FormHelperText>}
            <FormHelperText>
              {resetTiming === RESET_TIMING.NONE
                ? '全期間で連番を管理します。連番フィールドが必要です。'
                : '指定した期間ごとに連番をリセットします。'}
            </FormHelperText>
          </FormControl>
        )}
      />

      {/* 連番フィールド（resetTiming が 'none' の場合のみ表示） */}
      {resetTiming === RESET_TIMING.NONE && (
        <Controller
          name={`${basePath}.serialFieldCode` as never}
          control={control}
          render={({ field, fieldState: { error } }) => {
            const selectedOption =
              serialFieldOptions.find((o) => o.code === (field.value as unknown as string)) ?? null;

            return (
              <Autocomplete
                options={serialFieldOptions}
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
                      o.label.toLowerCase().includes(lower) || o.code.toLowerCase().includes(lower)
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
                    label='連番管理フィールド'
                    placeholder='連番を保存するフィールドを選択'
                    size='small'
                    error={!!error}
                    helperText={
                      error?.message ||
                      '数値フィールドのみ選択可能です。このフィールドに最新の連番が保存されます。'
                    }
                  />
                )}
              />
            );
          }}
        />
      )}
    </Box>
  );
};
