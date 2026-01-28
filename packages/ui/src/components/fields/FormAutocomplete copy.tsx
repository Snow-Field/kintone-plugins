import { Controller, useFormContext } from 'react-hook-form';
import {
  Autocomplete,
  Box,
  TextField,
  Typography,
  type AutocompleteProps,
  type AutocompleteValue,
  type TextFieldProps,
} from '@mui/material';

export type BaseOption = {
  label: string;
  code: string;
};

type FormAutocompleteProps<
  TOption extends BaseOption,
  Multiple extends boolean | undefined,
  DisableClearable extends boolean | undefined,
  FreeSolo extends boolean | undefined,
> = Omit<
  AutocompleteProps<TOption, Multiple, DisableClearable, FreeSolo>,
  'renderInput' | 'onChange' | 'value'
> & {
  name: string;
  label?: string;
  placeholder?: string;
  textFieldProps?: TextFieldProps;
  toOption?: (
    value: any,
    options: TOption[]
  ) => AutocompleteValue<TOption, Multiple, DisableClearable, FreeSolo>;
  toValue?: (value: AutocompleteValue<TOption, Multiple, DisableClearable, FreeSolo>) => any;
};

export const FormAutocomplete = <
  TOption extends BaseOption,
  Multiple extends boolean | undefined = false,
  DisableClearable extends boolean | undefined = false,
  FreeSolo extends boolean | undefined = false,
>({
  name,
  label,
  placeholder,
  options,
  toOption,
  toValue,
  textFieldProps,
  ...autocompleteProps
}: FormAutocompleteProps<TOption, Multiple, DisableClearable, FreeSolo>) => {
  const { control } = useFormContext();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => {
        // toOption が指定されていない場合のデフォルト変換
        const autocompleteValue = toOption
          ? toOption(field.value, options)
          : (field.value as AutocompleteValue<TOption, Multiple, DisableClearable, FreeSolo>);

        return (
          <Autocomplete
            {...autocompleteProps}
            options={options}
            value={autocompleteValue}
            onChange={(_, newValue) => {
              const v = toValue ? toValue(newValue) : newValue;
              field.onChange(v);
            }}
            getOptionLabel={(option) => {
              if (typeof option === 'string') return option;
              return option.label;
            }}
            isOptionEqualToValue={(option, v) => {
              if (typeof v === 'string') return option.code === v;
              return option.code === v.code;
            }}
            renderGroup={(params) => (
              <Box key={params.key}>
                <Box
                  sx={{
                    position: 'sticky',
                    top: '-8px',
                    p: '4px 10px',
                    bgcolor: '#E2F1FD',
                    color: '#1976D2',
                    fontSize: '0.9rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    zIndex: 1,
                  }}
                >
                  {params.group}
                </Box>
                {params.children}
              </Box>
            )}
            renderOption={(props, option) => {
              // option が string の場合 (freeSolo で追加された場合など) のハンドリング
              // 通常 options 配列由来ならオブジェクトだが、念のため
              const isString = typeof option === 'string';
              const optionLabel = isString ? option : option.label;
              const optionCode = isString ? option : option.code;

              const { key, ...rest } = props;
              return (
                <Box
                  key={key}
                  component='li'
                  {...rest}
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start !important',
                  }}
                >
                  <Typography variant='caption' color='text.secondary' sx={{ fontSize: '10px' }}>
                    コード: {optionCode}
                  </Typography>
                  <Typography variant='body2'>{optionLabel}</Typography>
                </Box>
              );
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                {...textFieldProps}
                label={label}
                placeholder={placeholder}
                variant='outlined'
                color='primary'
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
              />
            )}
            sx={{
              width: { xs: '100%', sm: 400 },
              ...autocompleteProps.sx,
            }}
          />
        );
      }}
    />
  );
};
