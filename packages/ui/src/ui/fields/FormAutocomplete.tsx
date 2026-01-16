import type { FC } from "react";
import {
  Controller,
  useFormContext,
  type FieldValues,
  type ControllerRenderProps,
  type ControllerFieldState,
} from "react-hook-form";
import { Autocomplete, Box, TextField, Typography } from "@mui/material";
import type { SxProps, Theme } from "@mui/material";

type Props = {
  name: string;
  label: string;
  placeholder?: string;
  options: Array<{ label: string; code: string }>;
  shouldShowOption?: (field: { label: string; code: string }) => boolean;
  sx?: SxProps<Theme>;
};

export const FormAutocomplete: FC<Props> = ({
  name,
  label,
  placeholder,
  options,
  shouldShowOption,
  sx,
}) => {
  const { control } = useFormContext<FieldValues>();
  // optionsをフィルタリング
  const filteredOptions = shouldShowOption
    ? options.filter(shouldShowOption)
    : options;

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
          onChange={(_, field) => onChange(field?.code ?? "")}
          fullWidth
          sx={{
            width: { xs: "100%", sm: 400 },
            ...sx,
          }}
          renderOption={(props, option) => {
            const { key, ...rest } = props;
            return (
              <Box
                key={key}
                component="li"
                {...rest}
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start !important",
                }}
              >
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ fontSize: "10px" }}
                >
                  コード: {option.code}
                </Typography>
                <Typography variant="body2">{option.label}</Typography>
              </Box>
            );
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              label={label}
              placeholder={placeholder}
              variant="outlined"
              color="primary"
              error={!!error}
              helperText={error?.message}
            />
          )}
        />
      )}
    />
  );
};
