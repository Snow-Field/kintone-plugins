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
  'RECORD_NUMBER',
  'CREATOR',
  'MODIFIER',
  'CREATED_TIME',
  'UPDATED_TIME',
] as const;

type Props = {
  name: string;
  label?: string;
  multiple?: boolean;
};

/**
 * kintone フィールド一覧から対象フィールドを選択するコンポーネント
 */
export const FieldSelect: FC<Props> = ({ name, label = '対象フィールド', multiple = false }) => {
  const { control } = useFormContext<PluginConfig>();
  const { fields } = useAppFields(
    TARGET_FIELD_TYPES as unknown as Parameters<typeof useAppFields>[0]
  );

  return (
    <Controller
      name={name as never}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <FormControl fullWidth error={!!error} size='small'>
          <InputLabel>{label}</InputLabel>
          <Select
            {...field}
            multiple={multiple}
            label={label}
            value={multiple ? (Array.isArray(field.value) ? field.value : []) : (field.value ?? '')}
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
