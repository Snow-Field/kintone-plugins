import type { TabItem } from '@kintone-plugin/ui';
import { TargetsSettings } from './components/TargetsSettings';
import { UsageGuide } from './components/UsageGuide';

/** 設定画面のタブ */
export const tabs: TabItem[] = [
  { label: '接続先', content: <TargetsSettings /> },
  { label: '使い方', content: <UsageGuide /> },
];
