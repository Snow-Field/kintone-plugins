import type { FC } from 'react';
import { FormSection, Text } from '@kintone-plugin/ui';
import { NumberingSettingsList } from './NumberingSettingsList';

export const NumberingSettings: FC = () => {
  return (
    <FormSection>
      <Text variant='sectionTitle'>採番設定</Text>
      <Text variant='description' last>
        自動採番のルールを設定します。複数の採番設定を追加できます（最大5件）。
      </Text>
      <NumberingSettingsList />
    </FormSection>
  );
};
