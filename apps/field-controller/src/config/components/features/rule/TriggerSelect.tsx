import { type FC } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import {
  FormControl,
  Select,
  MenuItem,
  Chip,
  Box,
  FormHelperText,
  IconButton,
  Tooltip,
  InputAdornment,
} from '@mui/material';
import ClearAllIcon from '@mui/icons-material/ClearAll';
import { type PluginConfig } from '@/shared/config';

type TriggerOption = {
  label: string;
  value: string;
};

type Props = {
  name: string;
  options: TriggerOption[];
};

/**
 * トリガーイベントのマルチセレクトコンポーネント
 * ラベルなし・クリアボタン付き
 */
export const TriggerSelect: FC<Props> = ({ name, options }) => {
  const { control, setValue, watch } = useFormContext<PluginConfig>();
  const currentValue = (watch(name as never) as unknown as string[]) ?? [];

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setValue(name as never, [] as never, { shouldDirty: true });
  };

  return (
    <Controller
      name={name as never}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <FormControl fullWidth error={!!error} size='small'>
          <Select
            {...field}
            multiple
            displayEmpty
            value={Array.isArray(field.value) ? (field.value as string[]) : []}
            renderValue={(selected) => {
              const arr = selected as string[];
              if (arr.length === 0) {
                return (
                  <Box component='span' sx={{ color: 'text.disabled' }}>
                    イベントを選択
                  </Box>
                );
              }
              return (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {arr.map((val) => {
                    const option = options.find((o) => o.value === val);
                    return <Chip key={val} label={option?.label ?? val} size='small' />;
                  })}
                </Box>
              );
            }}
            endAdornment={
              currentValue.length > 0 ? (
                <InputAdornment position='end' sx={{ mr: 2 }}>
                  <Tooltip title='選択をすべてクリア'>
                    <IconButton size='small' color='error' onClick={handleClear} edge='end'>
                      <ClearAllIcon fontSize='small' />
                    </IconButton>
                  </Tooltip>
                </InputAdornment>
              ) : undefined
            }
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
