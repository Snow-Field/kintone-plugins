import { type ReactNode } from 'react';
import { InvisibleSettings } from './InvisibleSettings';
import { DisableSettings } from './DisableSettings';

export type TabItem = {
  label: string;
  content: ReactNode;
};

export const FormTabs: TabItem[] = [
  {
    label: '非表示設定',
    content: <InvisibleSettings />,
  },
  {
    label: '編集不可設定',
    content: <DisableSettings />,
  },
];
