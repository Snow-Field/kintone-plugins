import { type FC, useState } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Menu,
  MenuItem,
  TextField,
} from '@mui/material';
import { kintoneApiBaseUrl } from '@/shared/lib/targets';

type Props = {
  /** 作った URL を受け取る */
  onSelect: (url: string) => void;
};

/** kintone REST API の URL を入れるボタン。ゲストスペースのアプリなら、スペースの ID を聞く */
export const KintoneUrlButton: FC<Props> = ({ onSelect }) => {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const [guestOpen, setGuestOpen] = useState(false);
  const [spaceId, setSpaceId] = useState('');
  const isValidSpaceId = /^\d+$/.test(spaceId);

  return (
    <>
      <Button
        size='small'
        onClick={(e) => setAnchor(e.currentTarget)}
        sx={{ whiteSpace: 'nowrap' }}
      >
        kintone の URL を入れる
      </Button>
      <Menu anchorEl={anchor} open={anchor !== null} onClose={() => setAnchor(null)}>
        <MenuItem
          onClick={() => {
            setAnchor(null);
            onSelect(kintoneApiBaseUrl(location.origin));
          }}
        >
          通常のアプリ（/k/v1/）
        </MenuItem>
        <MenuItem
          onClick={() => {
            setAnchor(null);
            setGuestOpen(true);
          }}
        >
          ゲストスペースのアプリ（/k/guest/スペースID/v1/）
        </MenuItem>
      </Menu>
      <Dialog open={guestOpen} onClose={() => setGuestOpen(false)}>
        <DialogTitle>ゲストスペースの ID</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            label='スペース ID'
            value={spaceId}
            onChange={(e) => setSpaceId(e.target.value.trim())}
            error={spaceId !== '' && !isValidSpaceId}
            helperText='ゲストスペースのアプリの URL（/k/guest/〇〇/...）の数字です'
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setGuestOpen(false)}>キャンセル</Button>
          <Button
            variant='contained'
            disabled={!isValidSpaceId}
            onClick={() => {
              setGuestOpen(false);
              onSelect(kintoneApiBaseUrl(location.origin, spaceId));
            }}
          >
            入れる
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
