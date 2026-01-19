import { type FC, useState } from 'react';
import { MenuItem, ListItemIcon, ListItemText } from '@mui/material';
import { RestartAlt } from '@mui/icons-material';
import { ResetConfirmDialog } from '../feedback/ResetConfirmDialog';

type Props = {
  onReset: () => void;
};

export const ResetMenuItem: FC<Props> = ({ onReset }) => {
  const [open, setOpen] = useState(false);

  const handleConfirm = () => {
    onReset();
    setOpen(false);
  };

  return (
    <>
      <MenuItem onClick={() => setOpen(true)}>
        <ListItemIcon>
          <RestartAlt fontSize='small' />
        </ListItemIcon>
        <ListItemText>設定をリセット</ListItemText>
      </MenuItem>
      <ResetConfirmDialog open={open} onConfirm={handleConfirm} onClose={() => setOpen(false)} />
    </>
  );
};
