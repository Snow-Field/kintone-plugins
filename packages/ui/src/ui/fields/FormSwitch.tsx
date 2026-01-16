import type { FC } from "react";
import {
  Controller,
  useFormContext,
  type FieldValues,
  type ControllerRenderProps,
} from "react-hook-form";
import { FormControlLabel, Switch } from "@mui/material";
import type { SwitchProps } from "@mui/material";

type Props = {
  name: string;
  label?: string;
} & Omit<SwitchProps, "checked">;

export const FormSwitch: FC<Props> = ({ name, label, ...switchProps }) => {
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
        <FormControlLabel
          control={
            <Switch
              {...switchProps}
              size="small"
              checked={!!value}
              onChange={(e) => onChange(e.target.checked)}
            />
          }
          label={label}
        />
      )}
    />
  );
};
