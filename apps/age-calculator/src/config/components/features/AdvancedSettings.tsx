import type { FC } from 'react';
import { FormSection, Text, FormSwitch } from '@kintone-plugin/ui';

export const AdvancedSettings: FC = () => {
  return (
    <FormSection>
      <Text variant='sectionTitle'>レコード保存時の設定</Text>
      <Text variant='description' last>
        レコード保存時に最新の年齢へ自動更新するか選択してください。
      </Text>
      <FormSwitch name='advanced.isUpdateOnSave' label='レコード保存時に最新の年齢へ更新する' />
    </FormSection>
  );
};
