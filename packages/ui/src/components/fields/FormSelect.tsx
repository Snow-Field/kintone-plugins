import { useId } from 'react';
import { Controller, type FieldPath, type FieldValues, useFormContext } from 'react-hook-form';
import { FormControl, FormHelperText, InputLabel, MenuItem, Select } from '@mui/material';
import type { SelectProps } from '@mui/material';

/** 選択肢。`value` がフォームに保存される */
export type FormSelectOption = {
  value: string;
  label: string;
};

/** React Hook Form が管理するため、外から受け取らない props */
type ManagedProps =
  | 'name'
  | 'value'
  | 'defaultValue'
  | 'onChange'
  | 'error'
  | 'label'
  | 'labelId'
  | 'multiple'
  | 'children';

export type FormSelectProps<TFieldValues extends FieldValues = FieldValues> = {
  name: FieldPath<TFieldValues>;
  label?: string;
  options: readonly FormSelectOption[];
  /** 利用者が値を変えた後に呼ぶ。ほかの項目のリセットなどに使う */
  onValueChange?: (value: string) => void;
} & Omit<SelectProps<string>, ManagedProps>;

/**
 * 選択肢から1つ選ぶ入力欄（MUI の Select を React Hook Form につないだもの）
 * 値は選択肢の `value`（`string`）。選択肢に無い値が保存されていると、未選択として表示する
 */
export const FormSelect = <TFieldValues extends FieldValues = FieldValues>({
  name,
  label,
  options,
  onValueChange,
  size,
  fullWidth,
  sx,
  disabled,
  onBlur,
  ...selectProps
}: FormSelectProps<TFieldValues>) => {
  const { control } = useFormContext<TFieldValues>();
  const labelId = useId();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => {
        const value =
          typeof field.value === 'string' && options.some((o) => o.value === field.value)
            ? field.value
            : '';
        return (
          <FormControl
            size={size}
            fullWidth={fullWidth}
            sx={sx}
            disabled={disabled}
            error={!!error}
          >
            {label && <InputLabel id={labelId}>{label}</InputLabel>}
            <Select<string>
              {...selectProps}
              labelId={label ? labelId : undefined}
              label={label}
              name={field.name}
              value={value}
              inputRef={field.ref}
              onChange={(e) => {
                field.onChange(e.target.value);
                onValueChange?.(e.target.value);
              }}
              onBlur={(e) => {
                field.onBlur();
                onBlur?.(e);
              }}
            >
              {options.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
            {error && <FormHelperText>{error.message}</FormHelperText>}
          </FormControl>
        );
      }}
    />
  );
};
