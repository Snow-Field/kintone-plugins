import { type FC } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { Autocomplete, TextField, Chip, Checkbox } from '@mui/material';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
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
 * トリガーイベントの Autocomplete（multiple）コンポーネント
 * - タイプで絞り込み可能
 * - Selection indicators（チェックボックスアイコン）で選択状態を表示
 * - 標準のクリアボタン（×）で全解除
 */
export const TriggerSelect: FC<Props> = ({ name, options }) => {
  const { control } = useFormContext<PluginConfig>();

  return (
    <Controller
      name={name as never}
      control={control}
      render={({ field, fieldState: { error } }) => {
        // 保存値（string[]）→ TriggerOption[] に変換
        const fieldValue = Array.isArray(field.value) ? (field.value as string[]) : [];
        const selectedOptions = fieldValue
          .map((v) => options.find((o) => o.value === v))
          .filter((o): o is TriggerOption => o !== undefined);

        return (
          <Autocomplete
            multiple
            options={options}
            value={selectedOptions}
            onChange={(_, newValue) => {
              // TriggerOption[] → string[] に変換して保存
              field.onChange(newValue.map((o) => o.value));
            }}
            getOptionLabel={(option) => option.label}
            isOptionEqualToValue={(option, value) => option.value === value.value}
            disableCloseOnSelect
            size='small'
            renderOption={(props, option, { selected }) => {
              const { key, ...rest } = props;
              return (
                <li key={key} {...rest}>
                  <Checkbox
                    icon={<CheckBoxOutlineBlankIcon fontSize='small' />}
                    checkedIcon={<CheckBoxIcon fontSize='small' />}
                    checked={selected}
                    sx={{ mr: 1, p: 0 }}
                  />
                  {option.label}
                </li>
              );
            }}
            renderValue={(value) =>
              value.map((option, index) => (
                <Chip
                  key={option.value}
                  label={option.label}
                  size='small'
                  sx={{ mt: 0.5, mr: 0.5 }}
                  onDelete={() => {
                    const next = [...value];
                    next.splice(index, 1);
                    field.onChange(next.map((o) => o.value));
                  }}
                />
              ))
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label='イベント'
                size='small'
                error={!!error}
                helperText={error?.message}
              />
            )}
          />
        );
      }}
    />
  );
};
