import type { ReactNode } from 'react';

export type TabItem = {
  /** タブの名前。React の key にも使うので、同じ画面の中で重複させない */
  label: string;
  content: ReactNode;
};
