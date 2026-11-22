import { Controller, type FieldPath, type FieldValues, useFormContext } from 'react-hook-form';
import { TextField } from '@mui/material';
import type { TextFieldProps } from '@mui/material';

/** React Hook Form が管理するため、外から受け取らない props */
type ManagedProps =
  | 'name'
  | 'value'
  | 'defaultValue'
  | 'onChange'
  | 'error'
  | 'helperText'
  | 'type';

export type FormNumberFieldProps<TFieldValues extends FieldValues = FieldValues> = {
  name: FieldPath<TFieldValues>;
  label?: string;
} & Omit<TextFieldProps, ManagedProps>;

/**
 * 数値を入力する欄（MUI の TextField を React Hook Form につないだもの）
 * 値は number。空にすると null を保存し、未入力として検証エラーにできる
 */
export const FormNumberField = <TFieldValues extends FieldValues = FieldValues>({
  name,
  label,
  onBlur,
  ...textFieldProps
}: FormNumberFieldProps<TFieldValues>) => {
  const { control } = useFormContext<TFieldValues>();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <TextField
          {...textFieldProps}
          type='number'
          name={field.name}
          label={label}
          value={typeof field.value === 'number' && !Number.isNaN(field.value) ? field.value : ''}
          inputRef={field.ref}
          onChange={(e) => field.onChange(e.target.value === '' ? null : Number(e.target.value))}
          onBlur={(e) => {
            field.onBlur();
            onBlur?.(e);
          }}
          error={!!error}
          helperText={error?.message}
        />
      )}
    />
  );
};
