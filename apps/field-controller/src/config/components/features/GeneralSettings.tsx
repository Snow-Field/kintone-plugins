import type { FC } from 'react';
import { TextField } from '@mui/material';
import { Controller, useFormContext } from 'react-hook-form';
import { FormSection, FormTitle, FormDescription } from '@kintone-plugin/ui';
import type { PluginConfig } from '@/shared/config';

export const GeneralSettings: FC = () => {
  const { control } = useFormContext<PluginConfig>();

  return (
    <FormSection>
      <FormTitle>基本設定</FormTitle>
      <FormDescription last>プラグインの基本的な設定を行います。</FormDescription>
      <Controller
        name="message"
        control={control}
        render={({ field }) => (
          <TextField {...field} label="設定メッセージ" variant="outlined" fullWidth sx={{ maxWidth: 400 }} />
        )}
      />
    </FormSection>
  );
};
