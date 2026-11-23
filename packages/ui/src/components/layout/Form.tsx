import type { FC } from 'react';
import { Box } from '@mui/material';
import type { TabItem } from '../../types';

type Props = {
  tabs: TabItem[];
  activeTab: number;
  /**
   * 操作を受け付けないようにする（保存中など）。
   * 入力欄ごとではなく、中身全体（各プラグイン固有の部品を含む）のクリック・キー入力・フォーカスを止める
   */
  disabled?: boolean;
};

export const Form: FC<Props> = ({ tabs, activeTab, disabled = false }) => {
  return (
    <Box
      inert={disabled}
      aria-busy={disabled}
      sx={{
        p: 3,
        flexGrow: 1,
        overflowY: 'auto',
        opacity: disabled ? 0.6 : 1,
        transition: 'opacity 0.2s',
      }}
    >
      {tabs.map((tab, index) => (
        <div
          role='tabpanel'
          hidden={activeTab !== index}
          id={`scrollable-auto-tabpanel-${index}`}
          aria-labelledby={`scrollable-auto-tab-${index}`}
          key={tab.label}
        >
          {activeTab === index && tab.content}
        </div>
      ))}
    </Box>
  );
};
