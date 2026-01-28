import { Controller, useFormContext, type FieldValues } from 'react-hook-form';
import { Autocomplete, TextField } from '@mui/material';
import type { SxProps, Theme, AutocompleteProps } from '@mui/material';

export type BaseOption = {
  label: string;
  code: string;
};

type FormAutocompleteProps<
  TOption,
  TFieldValue = unknown,
  TMultiple extends boolean | undefined = false,
> = {
  name: string;
  label: string;
  placeholder?: string;
  sx?: SxProps<Theme>;

  /** RHF value -> Autocomplete value */
  toOption: (value: TFieldValue, options: readonly TOption[]) => TOption | null;

  /** Autocomplete value -> RHF value */
  toValue: (option: TOption | null) => TFieldValue;

  /** TextField を拡張したい時用 */
  textFieldProps?: Omit<React.ComponentProps<typeof TextField>, 'value' | 'onChange'>;
} & Omit<AutocompleteProps<TOption, TMultiple, false, false>, 'renderInput' | 'value' | 'onChange'>;

export const FormAutocomplete = <
  TOption,
  TFieldValue,
  TMultiple extends boolean | undefined = false,
>({
  name,
  label,
  placeholder,
  sx,
  toOption,
  toValue,
  textFieldProps,
  options,
  ...autocompleteProps
}: FormAutocompleteProps<TOption, TFieldValue, TMultiple>) => {
  const { control } = useFormContext<FieldValues>();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <Autocomplete
          {...autocompleteProps}
          options={options}
          value={toOption(field.value, options)}
          onChange={(_, option) => field.onChange(toValue(option))}
          sx={{
            width: { xs: '100%', sm: 400 },
            ...sx,
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              {...textFieldProps}
              label={label}
              placeholder={placeholder}
              error={!!fieldState.error}
              helperText={fieldState.error?.message}
            />
          )}
        />
      )}
    />
  );
};
