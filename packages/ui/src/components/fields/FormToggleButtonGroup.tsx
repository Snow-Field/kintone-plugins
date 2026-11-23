import { Controller, type FieldPath, type FieldValues, useFormContext } from 'react-hook-form';
import { FormControl, FormHelperText, ToggleButton, ToggleButtonGroup } from '@mui/material';
import type { ToggleButtonGroupProps } from '@mui/material';

/** 選択肢。`value` がフォームに保存される */
export type FormToggleButtonOption = {
  value: string;
  label: string;
};

/** React Hook Form が管理するため、外から受け取らない props */
type ManagedProps = 'value' | 'onChange' | 'exclusive' | 'children';

export type FormToggleButtonGroupProps<TFieldValues extends FieldValues = FieldValues> = {
  name: FieldPath<TFieldValues>;
  /** ボタンのまとまりの名前（読み上げに使う） */
  label: string;
  options: readonly FormToggleButtonOption[];
} & Omit<ToggleButtonGroupProps, ManagedProps>;

/**
 * 選択肢を並べたボタンから、複数を選ぶ入力欄（MUI の ToggleButtonGroup を React Hook Form につないだもの）
 * 値は選んだ選択肢の `value` の配列（`string[]`）で、選択肢の順に並べる
 */
export const FormToggleButtonGroup = <TFieldValues extends FieldValues = FieldValues>({
  name,
  label,
  options,
  size = 'small',
  // 選んだボタンが分かるよう、既定で主色にする
  color = 'primary',
  ...groupProps
}: FormToggleButtonGroupProps<TFieldValues>) => {
  const { control } = useFormContext<TFieldValues>();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => {
        const selected: string[] = Array.isArray(field.value) ? field.value : [];
        return (
          <FormControl error={!!error}>
            <ToggleButtonGroup
              {...groupProps}
              size={size}
              color={color}
              aria-label={label}
              value={selected}
              onChange={(_, next: string[]) => {
                // 押した順ではなく、選択肢の順にそろえる（保存する値を安定させるため）
                field.onChange(options.map((o) => o.value).filter((v) => next.includes(v)));
              }}
              onBlur={field.onBlur}
            >
              {options.map((option, i) => (
                <ToggleButton
                  key={option.value}
                  value={option.value}
                  // 検証エラーのとき、React Hook Form が最初のボタンにフォーカスを移せるようにする
                  ref={i === 0 ? field.ref : undefined}
                  sx={{ px: 1.5 }}
                >
                  {option.label}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
            {error?.message && <FormHelperText>{error.message}</FormHelperText>}
          </FormControl>
        );
      }}
    />
  );
};
