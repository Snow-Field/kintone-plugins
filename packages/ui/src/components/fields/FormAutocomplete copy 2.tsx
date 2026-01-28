import {
  Controller,
  useFormContext,
  type FieldValues,
  type ControllerRenderProps,
  type ControllerFieldState,
} from 'react-hook-form';
import { Autocomplete, Box, TextField, Typography } from '@mui/material';
import type { SxProps, Theme } from '@mui/material';

export type AutocompleteOption = { label: string; code: string };

type Props<T extends AutocompleteOption> = {
  name: string;
  label: string;
  placeholder?: string;
  options: T[];
  shouldShowOption?: (option: T) => boolean;
  groupBy?: (option: T) => string;
  sx?: SxProps<Theme>;
};

export const FormAutocomplete = <T extends AutocompleteOption>({
  name,
  label,
  placeholder,
  options,
  shouldShowOption,
  groupBy,
  sx,
}: Props<T>) => {
  const { control } = useFormContext<FieldValues>();
  // optionsをフィルタリング
  let filteredOptions = shouldShowOption ? options.filter(shouldShowOption) : options;

  // groupByが指定されている場合、グループごとにソート（MUI Autocompleteの仕様上、ソート済みである必要がある）
  if (groupBy) {
    filteredOptions = [...filteredOptions].sort((a, b) => {
      const groupA = groupBy(a);
      const groupB = groupBy(b);
      if (groupA !== groupB) {
        return groupA.localeCompare(groupB, 'ja');
      }
      return a.label.localeCompare(b.label, 'ja');
    });
  }

  return (
    <Controller
      name={name}
      control={control}
      render={({
        field: { onChange, value },
        fieldState: { error },
      }: {
        field: ControllerRenderProps<FieldValues, string>;
        fieldState: ControllerFieldState;
      }) => (
        <Autocomplete
          options={filteredOptions}
          value={filteredOptions.find((opt) => opt.code === value) ?? null}
          getOptionLabel={(opt) => opt.label}
          isOptionEqualToValue={(opt, v) => opt.code === v.code}
          onChange={(_, field) => onChange(field?.code ?? '')}
          groupBy={groupBy}
          fullWidth
          sx={{
            width: { xs: '100%', sm: 400 },
            ...sx,
          }}
          renderGroup={(params) => {
            return (
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
            );
          }}
          renderOption={(props, option) => {
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
                  コード: {option.code}
                </Typography>
                <Typography variant='body2'>{option.label}</Typography>
              </Box>
            );
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              label={label}
              placeholder={placeholder}
              variant='outlined'
              color='primary'
              error={!!error}
              helperText={error?.message}
            />
          )}
        />
      )}
    />
  );
};
