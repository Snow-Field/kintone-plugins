import type { TabItem } from '@kintone-plugin/ui';
import { GeneralSettings } from './components/GeneralSettings';

/** 設定画面のタブ */
export const tabs: TabItem[] = [
  {
    label: '基本設定',
    content: <GeneralSettings />,
  },
];
