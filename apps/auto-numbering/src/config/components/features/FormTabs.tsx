import { type ReactNode } from 'react';
import { GeneralSettings } from './GeneralSettings';
import { NumberingSettings } from './NumberingSettings';

export type TabItem = {
  label: string;
  content: ReactNode;
};

export const FormTabs: TabItem[] = [
  {
    label: '採番設定',
    content: <NumberingSettings />,
  },
  {
    label: '共通設定',
    content: <GeneralSettings />,
  },
];
