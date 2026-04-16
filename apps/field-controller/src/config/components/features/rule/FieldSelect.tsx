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
  IconButton,
  Tooltip,
  InputAdornment,
} from '@mui/material';
import ClearAllIcon from '@mui/icons-material/ClearAll';
import { useAppFields } from '@kintone-plugin/kintone-utils';
import { type PluginConfig } from '@/shared/config';

/** 対象フィールドとして選択可能なフィールドタイプ */
const TARGET_FIELD_TYPES = [
  'SINGLE_LINE_TEXT',
  'MULTI_LINE_TEXT',
  'RICH_TEXT',
  'NUMBER',
  'CALC',
  'CHECK_BOX',
  'RADIO_BUTTON',
  'DROP_DOWN',
  'MULTI_SELECT',
  'DATE',
  'TIME',
  'DATETIME',
  'LINK',
  'USER_SELECT',
  'ORGANIZATION_SELECT',
  'GROUP_SELECT',
] as const;

type Props = {
  name: string;
  multiple?: boolean;
};

/**
 * kintone フィールド一覧から対象フィールドを選択するコンポーネント
 */
export const FieldSelect: FC<Props> = ({ name, multiple = false }) => {
  const { control, setValue, watch } = useFormContext<PluginConfig>();
  const { fields } = useAppFields(
    TARGET_FIELD_TYPES as unknown as Parameters<typeof useAppFields>[0]
  );

  const currentValue = watch(name as never) as unknown as string | string[];
  const hasValue = multiple
    ? Array.isArray(currentValue) && currentValue.length > 0
    : !!currentValue;

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setValue(name as never, (multiple ? [] : '') as never, { shouldDirty: true });
  };

  return (
    <Controller
      name={name as never}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <FormControl fullWidth error={!!error} size='small'>
          <InputLabel>対象フィールド</InputLabel>
          <Select
            {...field}
            multiple={multiple}
            label='対象フィールド'
            value={
              multiple
                ? Array.isArray(field.value)
                  ? (field.value as string[])
                  : []
                : ((field.value as unknown as string) ?? '')
            }
            renderValue={
              multiple
                ? (selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {(selected as string[]).map((code) => {
                        const f = fields.find((fi) => fi.code === code);
                        return <Chip key={code} label={f?.label ?? code} size='small' />;
                      })}
                    </Box>
                  )
                : undefined
            }
            endAdornment={
              hasValue ? (
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
            {fields.map((f) => (
              <MenuItem key={f.code} value={f.code}>
                {f.label}
                <Box component='span' sx={{ ml: 1, fontSize: '0.75rem', color: 'text.secondary' }}>
                  ({f.code})
                </Box>
              </MenuItem>
            ))}
          </Select>
          {error && <FormHelperText>{error.message}</FormHelperText>}
        </FormControl>
      )}
    />
  );
};
