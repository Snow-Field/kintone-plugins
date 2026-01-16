import { type FC, memo } from 'react';
import { Button, CircularProgress } from '@mui/material';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';

type Props = {
  onClick: () => void;
  loading?: boolean;
};

export const CancelButton: FC<Props> = memo(function CancelButton({ onClick, loading }) {
  return (
    <Button
      variant="contained"
      color="inherit"
      disabled={loading}
      startIcon={loading ? <CircularProgress color="inherit" size={20} /> : <ExitToAppIcon />}
      onClick={onClick}
    >
      キャンセル
    </Button>
  );
});
