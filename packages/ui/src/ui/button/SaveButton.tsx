import { type FC, memo } from 'react';
import { Button, CircularProgress } from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';

type Props = {
  loading?: boolean;
  disabled?: boolean;
};

export const SaveButton: FC<Props> = memo(function SaveButton({ loading, disabled }) {
  return (
    <Button
      type='submit'
      variant='contained'
      color='primary'
      startIcon={loading ? <CircularProgress color='inherit' size={18} /> : <SaveIcon />}
      disabled={disabled}
    >
      設定を保存
    </Button>
  );
});
