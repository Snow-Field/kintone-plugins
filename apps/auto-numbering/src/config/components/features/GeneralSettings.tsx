import type { FC } from 'react';
import { TextField, Box } from '@mui/material';
import { Controller, useFormContext } from 'react-hook-form';
import { FormSection, Text } from '@kintone-plugin/ui';
import type { PluginConfig } from '@/shared/config';

export const GeneralSettings: FC = () => {
  const { control } = useFormContext<PluginConfig>();

  return (
    <FormSection>
      <Text variant='sectionTitle'>共通設定</Text>
      <Text variant='description' last>
        プラグイン全体で使用する共通設定を行います。
      </Text>
      <Box sx={{ maxWidth: 600 }}>
        <Controller
          name='common.apiToken'
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label='API トークン（オプション）'
              type='password'
              variant='outlined'
              fullWidth
              helperText='採番処理で使用する API トークンを設定できます。未設定の場合はログインユーザーの権限で実行されます。'
            />
          )}
        />
      </Box>
    </FormSection>
  );
};
