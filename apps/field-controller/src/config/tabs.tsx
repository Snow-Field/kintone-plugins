import type { TabItem } from '@kintone-plugin/ui';
import { DisableSettings } from './components/DisableSettings';
import { InvisibleSettings } from './components/InvisibleSettings';

/** 設定画面のタブ */
export const tabs: TabItem[] = [
  {
    label: '編集不可設定',
    content: <DisableSettings />,
  },
  {
    label: '非表示設定',
    content: <InvisibleSettings />,
  },
];
