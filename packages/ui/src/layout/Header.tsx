import { type FC } from 'react';
import { Box, Tabs, Tab, Stack, Divider } from '@mui/material';
import { type TabItem } from '../types';
import { SaveButton } from '../ui/button/SaveButton';
import { CancelButton } from '../ui/button/CancelButton';
import { MenuButton } from '../ui/button/MenuButton';
import { ResetMenuItem } from '../ui/menu/ResetMenuItem';
import { ExportMenuItem } from '../ui/menu/ExportMenuItem';
import { ImportMenuItem } from '../ui/menu/ImportMenuItem';

type Props = {
  tabs: TabItem[];
  activeTab: number;
  onTabChange: (index: number) => void;
  onCancel: () => void;
  isSaveLoading?: boolean;
  isSaveDisabled?: boolean;
  menuActions: {
    reset: () => void;
    export: () => void;
    import: (data: unknown) => void;
  };
};

export const Header: FC<Props> = ({
  tabs,
  activeTab,
  onTabChange,
  onCancel,
  isSaveLoading,
  isSaveDisabled,
  menuActions,
}) => {
  /** メニューアクションの展開 */
  const { reset: onReset, export: onExport, import: onImport } = menuActions;

  /** タブ */
  const handleTabChange = (_: React.SyntheticEvent, index: number) => {
    onTabChange(index);
  };

  const getTabA11yProps = (index: number) => {
    return {
      id: `scrollable-auto-tab-${index}`,
      'aria-controls': `scrollable-auto-tabpanel-${index}`, // IDで指定した要素を操作するものとスクリーンリーダーに伝えるための属性
    };
  };

  return (
    <Box
      component='header'
      sx={{
        // レイアウト設定
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',

        // 配置・固定設定
        position: 'sticky',
        top: 48, // kintoneヘッダーの高さを考慮
        zIndex: 30,

        // スペーシング設定
        pt: 1, // 上方向のパディング
        pr: 2, // 水平方向のパディング

        // スタイル設定
        bgcolor: 'background.paper',
        borderBottom: 1,
        borderColor: 'divider',
      }}
    >
      {/* 左側コンテンツ：タブ */}
      <Tabs
        value={activeTab}
        onChange={handleTabChange}
        variant='scrollable'
        scrollButtons='auto'
        aria-label='scrollable-auto-tabs'
      >
        {tabs.map((tab, index) => (
          <Tab label={tab.label} key={index} {...getTabA11yProps(index)} />
        ))}
      </Tabs>

      {/* 右側コンテンツ：アクションボタン群 */}
      <Stack direction='row' alignItems='center' spacing={3} sx={{ mb: 1 }}>
        <SaveButton loading={isSaveLoading} disabled={isSaveDisabled} />
        <CancelButton onClick={onCancel} loading={isSaveLoading} />
        <MenuButton disabled={isSaveLoading}>
          <ImportMenuItem onImport={onImport} />
          <ExportMenuItem onExport={onExport} />
          <Divider />
          <ResetMenuItem onReset={onReset} />
        </MenuButton>
      </Stack>
    </Box>
  );
};
