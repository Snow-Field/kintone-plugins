import { type FC } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import {
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  FormHelperText,
} from '@mui/material';
import { type PluginConfig } from '@/shared/config';
import { CONNECTORS } from '@/shared/constant/numbering';

type Props = {
  name: string;
};

/** 区切り文字の選択肢 */
const CONNECTOR_OPTIONS = [
  { value: CONNECTORS.HYPHEN, label: 'ハイフン（-）', example: '営業部-26-00001' },
] as const;

/**
 * パーツ間の区切り文字を選択するコンポーネント
 */
export const ConnectorSelector: FC<Props> = ({ name }) => {
  const { control } = useFormContext<PluginConfig>();

  return (
    <Controller
      name={name as never}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <FormControl component='fieldset' error={!!error} fullWidth>
          <FormLabel component='legend'>区切り文字</FormLabel>
          <RadioGroup {...field} value={field.value as string}>
            {CONNECTOR_OPTIONS.map((option) => (
              <FormControlLabel
                key={option.value}
                value={option.value}
                control={<Radio size='small' />}
                label={
                  <span>
                    {option.label}
                    <span style={{ marginLeft: 8, color: '#666', fontSize: '0.875rem' }}>
                      例: {option.example}
                    </span>
                  </span>
                }
              />
            ))}
          </RadioGroup>
          {error && <FormHelperText>{error.message}</FormHelperText>}
        </FormControl>
      )}
    />
  );
};
