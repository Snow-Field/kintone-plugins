import { type FC } from 'react';
import { FormSection, Text } from '@kintone-plugin/ui';
import { RuleList } from './rule/RuleList';

/** 非表示制御で使用できるトリガーイベント */
const VISIBILITY_TRIGGER_OPTIONS = [
  { label: '詳細画面表示時（PC）', value: 'app.record.detail.show' },
  { label: '追加画面表示時（PC）', value: 'app.record.create.show' },
  { label: '編集画面表示時（PC）', value: 'app.record.edit.show' },
  { label: '詳細画面表示時（モバイル）', value: 'mobile.app.record.detail.show' },
  { label: '追加画面表示時（モバイル）', value: 'mobile.app.record.create.show' },
  { label: '編集画面表示時（モバイル）', value: 'mobile.app.record.edit.show' },
];

/**
 * 非表示設定タブのコンテンツ
 */
export const InvisibleSettings: FC = () => {
  return (
    <FormSection>
      <Text variant='sectionTitle'>非表示設定</Text>
      <Text variant='description' last>
        条件が一致したとき、指定したフィールドを非表示にするルールを設定します。
        トリガーイベント発生時に条件を評価し、一致した場合にフィールドが非表示になります。
      </Text>
      <RuleList rulesPath='visibilityRules' triggerOptions={VISIBILITY_TRIGGER_OPTIONS} />
    </FormSection>
  );
};
