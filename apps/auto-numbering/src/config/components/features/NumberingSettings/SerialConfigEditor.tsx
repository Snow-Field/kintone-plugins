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
  Autocomplete,
  Typography,
} from '@mui/material';
import { useAppFields } from '@kintone-plugin/kintone-utils';
import { type PluginConfig, type FormatPart } from '@/shared/config';
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
  { value: 'prefix', label: '先頭' },
  { value: 'suffix', label: '末尾' },
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

  // formatParts の値を監視（position フィールドの表示制御用）
  // basePathから親パスを抽出（例: "numberingSettings.0.serialConfig" → "numberingSettings.0"）
  const parentPath = basePath.split('.').slice(0, -1).join('.');
  const formatPartsPath = `${parentPath}.formatParts` as const;
  const formatParts = useWatch({
    control,
    name: formatPartsPath as never,
  }) as unknown as FormatPart[];
  const hasFormatParts = formatParts && formatParts.length > 0;

  // リセットタイミングの選択肢を動的に決定
  const availableResetTimings = useMemo(() => {
    // フォーマットパーツから日付フォーマットの最大粒度を判定
    const dateFormats =
      formatParts
        ?.filter(
          (part): part is Extract<FormatPart, { type: 'date' }> =>
            part.type === 'date' && !!part.format
        )
        .map((part) => part.format) ?? [];

    // 日付フォーマットがない場合は NONE のみ
    if (dateFormats.length === 0) {
      return [RESET_TIMING_OPTIONS[0]]; // なし（全期間で連番）のみ
    }

    // 日付フォーマットに応じて利用可能なリセットタイミングを判定
    const hasDaily = dateFormats.some((fmt) => fmt === 'YYYYMMDD' || fmt === 'YYMMDD');
    const hasMonthly = hasDaily || dateFormats.some((fmt) => fmt === 'YYYYMM' || fmt === 'YYMM');
    const hasYearly = hasMonthly || dateFormats.some((fmt) => fmt === 'YYYY' || fmt === 'YY');

    return RESET_TIMING_OPTIONS.filter((option) => {
      if (option.value === RESET_TIMING.NONE) return true;
      if (option.value === RESET_TIMING.YEARLY) return hasYearly;
      if (option.value === RESET_TIMING.MONTHLY) return hasMonthly;
      if (option.value === RESET_TIMING.DAILY) return hasDaily;
      return false;
    });
  }, [formatParts]);

  // 現在のリセットタイミングが利用可能な選択肢に含まれていない場合を検出
  const currentResetTimingIsValid = useMemo(() => {
    return availableResetTimings.some((option) => option.value === resetTiming);
  }, [availableResetTimings, resetTiming]);

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
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      {/* 連番設定を1行にまとめる */}
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        {/* 連番位置（フォーマットパーツがある場合のみ表示） */}
        {hasFormatParts && (
          <Controller
            name={`${basePath}.position` as never}
            control={control}
            render={({ field, fieldState: { error } }) => (
              <Box sx={{ minWidth: 120, maxWidth: 150 }}>
                <FormLabel sx={{ fontSize: '0.875rem', mb: 0.5, display: 'block' }}>位置</FormLabel>
                <FormControl size='small' error={!!error} fullWidth>
                  <Select {...field} value={field.value as string}>
                    {POSITION_OPTIONS.map((option) => (
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
        )}

        {/* 初期値 */}
        <Controller
          name={`${basePath}.initialValue` as never}
          control={control}
          render={({ field, fieldState: { error } }) => (
            <Box sx={{ minWidth: 80, maxWidth: 100 }}>
              <FormLabel sx={{ fontSize: '0.875rem', mb: 0.5, display: 'block' }}>初期値</FormLabel>
              <TextField
                {...field}
                type='number'
                size='small'
                fullWidth
                slotProps={{
                  htmlInput: { min: 1 },
                }}
                onChange={(e) => {
                  const value = e.target.value === '' ? '' : Number(e.target.value);
                  field.onChange(value);
                }}
                error={!!error}
              />
              {error && <FormHelperText error>{error.message}</FormHelperText>}
            </Box>
          )}
        />

        {/* ゼロ埋め桁数 */}
        <Controller
          name={`${basePath}.digit` as never}
          control={control}
          render={({ field, fieldState: { error } }) => (
            <Box sx={{ minWidth: 80, maxWidth: 100 }}>
              <FormLabel sx={{ fontSize: '0.875rem', mb: 0.5, display: 'block' }}>桁数</FormLabel>
              <TextField
                {...field}
                type='number'
                size='small'
                fullWidth
                slotProps={{
                  htmlInput: { min: 1, max: 10 },
                }}
                onChange={(e) => {
                  const value = e.target.value === '' ? '' : Number(e.target.value);
                  field.onChange(value);
                }}
                error={!!error}
              />
              {error && <FormHelperText error>{error.message}</FormHelperText>}
            </Box>
          )}
        />

        {/* リセットタイミング */}
        <Controller
          name={resetTimingPath as never}
          control={control}
          render={({ field, fieldState: { error } }) => (
            <Box sx={{ minWidth: 200, maxWidth: 250 }}>
              <FormLabel sx={{ fontSize: '0.875rem', mb: 0.5, display: 'block' }}>
                連番リセットタイミング
              </FormLabel>
              <FormControl size='small' error={!!error || !currentResetTimingIsValid} fullWidth>
                <Select {...field} value={field.value as string}>
                  {availableResetTimings.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              {error && <FormHelperText error>{error.message}</FormHelperText>}
              {!error && !currentResetTimingIsValid && (
                <FormHelperText error>
                  現在の設定は無効です。適切な日付フォーマットを追加してください。
                </FormHelperText>
              )}
              {!error && currentResetTimingIsValid && (
                <FormHelperText>指定した期間ごとに連番をリセットします。</FormHelperText>
              )}
            </Box>
          )}
        />

        {/* 連番フィールド（resetTiming が 'none' の場合のみ表示） */}
        {resetTiming === RESET_TIMING.NONE && (
          <Controller
            name={`${basePath}.serialFieldCode` as never}
            control={control}
            render={({ field, fieldState: { error } }) => {
              const selectedOption =
                serialFieldOptions.find((o) => o.code === (field.value as unknown as string)) ??
                null;

              return (
                <Box sx={{ minWidth: 200, maxWidth: 250 }}>
                  <FormLabel sx={{ fontSize: '0.875rem', mb: 0.5, display: 'block' }}>
                    連番管理フィールド
                  </FormLabel>
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
                        placeholder='連番を保存するフィールドを選択'
                        size='small'
                        error={!!error}
                      />
                    )}
                  />
                  {error && <FormHelperText error>{error.message}</FormHelperText>}
                  {!error && (
                    <FormHelperText>
                      数値フィールドのみ選択可能です。このフィールドに最新の連番が保存されます。
                    </FormHelperText>
                  )}
                </Box>
              );
            }}
          />
        )}
      </Box>
    </Box>
  );
};
