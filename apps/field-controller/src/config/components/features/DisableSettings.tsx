import { type FC } from 'react';
import { FormSection, Text } from '@kintone-plugin/ui';
import { RuleList } from './rule/RuleList';

/** 編集不可制御で使用できるトリガーイベント */
const DISABLE_TRIGGER_OPTIONS = [
  { label: '一覧編集画面表示時（PC）', value: 'app.record.index.edit.show' },
  { label: '追加画面表示時（PC）', value: 'app.record.create.show' },
  { label: '編集画面表示時（PC）', value: 'app.record.edit.show' },
  { label: '追加画面表示時（モバイル）', value: 'mobile.app.record.create.show' },
  { label: '編集画面表示時（モバイル）', value: 'mobile.app.record.edit.show' },
];

/**
 * 編集不可設定タブのコンテンツ
 */
export const DisableSettings: FC = () => {
  return (
    <FormSection>
      <Text variant='sectionTitle'>編集不可設定</Text>
      <Text variant='description' last>
        条件が一致したとき、指定したフィールドを編集不可にするルールを設定します。
        トリガーイベント発生時に条件を評価し、一致した場合にフィールドが編集不可になります。
      </Text>
      <RuleList rulesPath='disableRules' triggerOptions={DISABLE_TRIGGER_OPTIONS} />
    </FormSection>
  );
};
