import type { FC } from 'react';
import { TextField } from '@mui/material';
import { Controller, useFormContext } from 'react-hook-form';
import { FormSection, Text } from '@kintone-plugin/ui';
import type { PluginConfig } from '@/shared/config';

export const GeneralSettings: FC = () => {
  const { control } = useFormContext<PluginConfig>();

  return (
    <FormSection>
      <Text variant='sectionTitle'>基本設定</Text>
      <Text variant='description' last>
        プラグインの基本的な設定を行います。
      </Text>
      <Controller
        name='message'
        control={control}
        render={({ field }) => (
          <TextField
            {...field}
            label='設定メッセージ'
            variant='outlined'
            fullWidth
            sx={{ maxWidth: 400 }}
          />
        )}
      />
    </FormSection>
  );
};
