import { type FC, memo } from 'react';
import { Button, CircularProgress } from '@mui/material';
import CancelIcon from '@mui/icons-material/Cancel';

type Props = {
  onClick: () => void;
  loading?: boolean;
};

export const CancelButton: FC<Props> = memo(function CancelButton({ onClick, loading }) {
  return (
    <Button
      variant='contained'
      color='inherit'
      disabled={loading}
      startIcon={loading ? <CircularProgress color='inherit' size={20} /> : <CancelIcon />}
      onClick={onClick}
    >
      キャンセル
    </Button>
  );
});
