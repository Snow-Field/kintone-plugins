import type { FC } from 'react';
import { Box } from '@mui/material';
import { FormSection, FormTextField, Text } from '@kintone-plugin/ui';
import type { PluginConfig } from '@/shared/config';

export const GeneralSettings: FC = () => (
  <FormSection>
    <Text variant='sectionTitle'>共通設定</Text>
    <Text variant='description'>
      採番処理で使用する API
      トークンを設定できます。未設定の場合はログインユーザーの権限で実行されます。
    </Text>
    <Text variant='description' last>
      {'トークンはアプリの利用者には見えない場所（プロキシ設定）に保存します。' +
        'ただし利用者は、トークンの権限で REST API を呼べます。' +
        '権限は「レコード閲覧」と「レコード編集」だけにしてください。保存後は「アプリを更新」で反映します。' +
        '以前の版で設定したトークンは利用者から読めていたため、再生成してから入れ直してください。'}
    </Text>
    <Box sx={{ maxWidth: 600 }}>
      <FormTextField<PluginConfig>
        name='common.apiToken'
        label='API トークン（オプション）'
        type='password'
        // ブラウザが kintone のログインのパスワードを自動入力しないように（off は無視されるため）
        autoComplete='new-password'
        fullWidth
      />
    </Box>
  </FormSection>
);
