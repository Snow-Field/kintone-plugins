import { useMemo } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { Autocomplete, Box, TextField, Typography } from '@mui/material';
import type { AutocompleteProps, SxProps, Theme } from '@mui/material';

export type AutoCompleteOption = {
  code: string;
  label: string;
  [key: string]: unknown;
};

type FieldValues = Record<string, string>;

type Props = {
  name: string;
  label: string;
  placeholder?: string;
  options: AutoCompleteOption[];
  groupBy?: (option: AutoCompleteOption) => string;
  sx?: SxProps<Theme>;
} & Omit<
  AutocompleteProps<AutoCompleteOption, false, false, false>,
  'options' | 'value' | 'onChange' | 'renderGroup' | 'renderOption' | 'renderInput'
>;

export const FormSingleAutocomplete = ({
  name,
  label,
  placeholder,
  options,
  groupBy,
  sx,
}: Props) => {
  const { control } = useFormContext<FieldValues>();

  /**
   * groupByに対応したオプションのソート
   * groupByが指定されている場合、MUI Autocompleteの仕様上、ソート済みである必要がある
   */
  const sortedOptions = useMemo(() => {
    if (!groupBy) return options;

    return [...options].sort((a, b) => {
      const groupA = groupBy(a);
      const groupB = groupBy(b);
      if (groupA !== groupB) {
        return groupA.localeCompare(groupB, 'ja');
      }
      return a.label.localeCompare(b.label, 'ja');
    });
  }, [options, groupBy]);

  /** optionsをコードで検索するためのマップ */
  const optionMap = useMemo(() => new Map(options.map((o) => [o.code, o])), [options]);

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <Autocomplete
          options={sortedOptions}
          value={optionMap.get(field.value) ?? null}
          getOptionLabel={(o) => o.label}
          isOptionEqualToValue={(o, v) => o.code === v.code}
          onChange={(_, v) => field.onChange(v?.code ?? '')}
          groupBy={groupBy}
          fullWidth
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
          sx={{
            width: { xs: '100%', sm: 400 },
            ...sx,
          }}
        />
      )}
    />
  );
};
