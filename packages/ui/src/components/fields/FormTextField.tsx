import type { FC } from 'react';
import {
  Controller,
  useFormContext,
  type FieldValues,
  type ControllerRenderProps,
} from 'react-hook-form';
import { TextField } from '@mui/material';
import { type TextFieldProps } from '@mui/material';

type Props = {
  name: string;
  label?: string;
} & TextFieldProps;

export const FormTextField: FC<Props> = ({ name, label, disabled, ...textFieldProps }) => {
  const { control } = useFormContext<FieldValues>();

  return (
    <Controller
      name={name}
      control={control}
      render={({
        field: { value, onChange },
      }: {
        field: ControllerRenderProps<FieldValues, string>;
      }) => (
        <TextField
          {...textFieldProps}
          label={label}
          value={value}
          variant='outlined'
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
        />
      )}
    />
  );
};
