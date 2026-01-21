import { type ReactNode } from 'react';
import { GeneralSettings } from './GeneralSettings';

export type TabItem = {
  label: string;
  content: ReactNode;
};

export const FormTabs: TabItem[] = [
  {
    label: '基本設定',
    content: <GeneralSettings />,
  },
];
