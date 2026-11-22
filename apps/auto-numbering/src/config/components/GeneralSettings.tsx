import type { FC } from 'react';
import { Box } from '@mui/material';
import { FormSection, FormTextField, Text } from '@kintone-plugin/ui';
import type { PluginConfig } from '@/shared/config';

export const GeneralSettings: FC = () => (
  <FormSection>
    <Text variant='sectionTitle'>共通設定</Text>
    <Text variant='description' last>
      採番処理で使用する API
      トークンを設定できます。未設定の場合はログインユーザーの権限で実行されます。
    </Text>
    <Box sx={{ maxWidth: 600 }}>
      <FormTextField<PluginConfig>
        name='common.apiToken'
        label='API トークン（オプション）'
        type='password'
        fullWidth
      />
    </Box>
  </FormSection>
);
