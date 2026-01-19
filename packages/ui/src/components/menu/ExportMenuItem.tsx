import { type FC } from 'react';
import { MenuItem, ListItemIcon, ListItemText } from '@mui/material';
import { FileDownload } from '@mui/icons-material';

type Props = {
  onExport: () => void;
};

export const ExportMenuItem: FC<Props> = ({ onExport }) => {
  return (
    <MenuItem onClick={onExport}>
      <ListItemIcon>
        <FileDownload fontSize='small' />
      </ListItemIcon>
      <ListItemText>設定をエクスポート</ListItemText>
    </MenuItem>
  );
};
