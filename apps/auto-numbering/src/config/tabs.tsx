import type { TabItem } from '@kintone-plugin/ui';
import { GeneralSettings } from './components/GeneralSettings';
import { NumberingSettings } from './components/numbering/NumberingSettings';

/** 設定画面のタブ */
export const tabs: TabItem[] = [
  {
    label: '採番設定',
    content: <NumberingSettings />,
  },
  {
    label: '共通設定',
    content: <GeneralSettings />,
  },
];
