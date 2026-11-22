import { Controller, type FieldPath, type FieldValues, useFormContext } from 'react-hook-form';
import { TextField } from '@mui/material';
import type { TextFieldProps } from '@mui/material';

/** React Hook Form が管理するため、外から受け取らない props */
type ManagedProps = 'name' | 'value' | 'defaultValue' | 'onChange' | 'error' | 'helperText';

export type FormTextFieldProps<TFieldValues extends FieldValues = FieldValues> = {
  name: FieldPath<TFieldValues>;
  label?: string;
} & Omit<TextFieldProps, ManagedProps>;

/**
 * 文字を入力する欄（MUI の TextField を React Hook Form につないだもの）
 * 検証エラーは入力欄の下に表示する
 */
export const FormTextField = <TFieldValues extends FieldValues = FieldValues>({
  name,
  label,
  onBlur,
  ...textFieldProps
}: FormTextFieldProps<TFieldValues>) => {
  const { control } = useFormContext<TFieldValues>();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <TextField
          {...textFieldProps}
          name={field.name}
          label={label}
          value={field.value ?? ''}
          inputRef={field.ref}
          onChange={(e) => field.onChange(e.target.value)}
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
