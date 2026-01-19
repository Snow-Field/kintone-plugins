import type { FC } from 'react';
import { FormSection, Text, FormSwitch } from '@kintone-plugin/ui';

export const AdvancedSettings: FC = () => {
  return (
    <FormSection>
      <Text variant='sectionTitle'>レコード保存時の設定</Text>
      <Text variant='description' last>
        レコード保存時に年齢計算を実行するか選択してください。
      </Text>
      <FormSwitch name='advanced.isUpdateOnSave' label='レコードを保存する度に年齢を更新する' />
    </FormSection>
  );
};
