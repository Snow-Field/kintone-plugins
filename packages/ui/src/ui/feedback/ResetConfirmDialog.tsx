import { type FC } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
} from '@mui/material';

type Props = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export const ResetConfirmDialog: FC<Props> = ({ open, onConfirm, onClose }) => {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>設定のリセット</DialogTitle>
      <DialogContent>
        <DialogContentText>
          このプラグインの設定を初期状態に戻します。よろしいですか？
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button variant="contained" color="error" onClick={onConfirm}>
          リセット
        </Button>
        <Button variant="contained" color="inherit" onClick={onClose}>
          キャンセル
        </Button>
      </DialogActions>
    </Dialog>
  );
};
