import type { TabItem } from '@kintone-plugin/ui';
import { AdvancedSettings } from './components/AdvancedSettings';
import { FieldMappingSection } from './components/FieldMappingSection';

/** 設定画面のタブ */
export const tabs: TabItem[] = [
  {
    label: '基本設定',
    content: <FieldMappingSection />,
  },
  {
    label: '詳細設定',
    content: <AdvancedSettings />,
  },
];
