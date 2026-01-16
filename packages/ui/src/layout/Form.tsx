import { type FC } from 'react';
import { Box } from '@mui/material';
import { type TabItem } from '../types';

type Props = {
  tabs: TabItem[];
  activeTab: number;
};

export const Form: FC<Props> = ({ tabs, activeTab }) => {
  return (
    <Box sx={{ p: 3, flexGrow: 1, overflowY: 'auto' }}>
      {tabs.map((tab, index) => (
        <div
          role='tabpanel'
          hidden={activeTab !== index}
          id={`scrollable-auto-tabpanel-${index}`}
          aria-labelledby={`scrollable-auto-tab-${index}`}
          key={index}
        >
          {activeTab === index && tab.content}
        </div>
      ))}
    </Box>
  );
};
