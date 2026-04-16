import { type FC } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Box,
  FormHelperText,
} from '@mui/material';
import { type PluginConfig } from '@/shared/config';

type TriggerOption = {
  label: string;
  value: string;
};

type Props = {
  name: string;
  label?: string;
  options: TriggerOption[];
};

/**
 * トリガーイベントのマルチセレクトコンポーネント
 */
export const TriggerSelect: FC<Props> = ({ name, label = 'トリガー', options }) => {
  const { control } = useFormContext<PluginConfig>();

  return (
    <Controller
      name={name as never}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <FormControl fullWidth error={!!error} size='small'>
          <InputLabel>{label}</InputLabel>
          <Select
            {...field}
            multiple
            label={label}
            value={Array.isArray(field.value) ? field.value : []}
            renderValue={(selected) => (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {(selected as string[]).map((val) => {
                  const option = options.find((o) => o.value === val);
                  return <Chip key={val} label={option?.label ?? val} size='small' />;
                })}
              </Box>
            )}
          >
            {options.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
          {error && <FormHelperText>{error.message}</FormHelperText>}
        </FormControl>
      )}
    />
  );
};
