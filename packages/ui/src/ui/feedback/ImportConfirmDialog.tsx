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

export const ImportConfirmDialog: FC<Props> = ({ open, onConfirm, onClose }) => {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>設定のインポート</DialogTitle>
      <DialogContent>
        <DialogContentText>
          現在の設定を上書きしてインポートします。よろしいですか？
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button variant='contained' color='primary' onClick={onConfirm}>
          インポート
        </Button>
        <Button variant='contained' color='inherit' onClick={onClose}>
          キャンセル
        </Button>
      </DialogActions>
    </Dialog>
  );
};
