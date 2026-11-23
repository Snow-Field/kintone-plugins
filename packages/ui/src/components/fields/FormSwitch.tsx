import { Controller, type FieldPath, type FieldValues, useFormContext } from 'react-hook-form';
import { FormControl, FormControlLabel, FormHelperText, Switch } from '@mui/material';
import type { SwitchProps } from '@mui/material';

/** React Hook Form が管理するため、外から受け取らない props */
type ManagedProps = 'name' | 'checked' | 'defaultChecked' | 'onChange';

export type FormSwitchProps<TFieldValues extends FieldValues = FieldValues> = {
  name: FieldPath<TFieldValues>;
  label?: string;
} & Omit<SwitchProps, ManagedProps>;

/**
 * オン・オフを切り替えるスイッチ（MUI の Switch を React Hook Form につないだもの）
 * 値は boolean。検証エラーはスイッチの下に表示する
 */
export const FormSwitch = <TFieldValues extends FieldValues = FieldValues>({
  name,
  label,
  onBlur,
  ...switchProps
}: FormSwitchProps<TFieldValues>) => {
  const { control } = useFormContext<TFieldValues>();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => {
        const control = (
          <Switch
            {...switchProps}
            name={field.name}
            checked={!!field.value}
            onChange={(e) => field.onChange(e.target.checked)}
            onBlur={(e) => {
              field.onBlur();
              onBlur?.(e);
            }}
          />
        );
        return (
          <FormControl error={!!error}>
            {/* ラベルが無いときはスイッチだけを出す（FormControlLabel の余白で幅が広がるため） */}
            {label === undefined ? control : <FormControlLabel label={label} control={control} />}
            {error && <FormHelperText>{error.message}</FormHelperText>}
          </FormControl>
        );
      }}
    />
  );
};
