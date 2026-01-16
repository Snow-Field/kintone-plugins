import { type ReactNode } from 'react';
import { AdvancedSettings } from '@/config/components/features/AdvancedSettings';
import { FieldMappingSection } from '@/config/components/features/FieldMappingSection';

export type TabItem = {
  label: string;
  content: ReactNode;
};

export const FormTabs: TabItem[] = [
  {
    label: '基本設定',
    content: <FieldMappingSection />,
  },
  {
    label: '詳細設定',
    content: <AdvancedSettings />,
  },
];
