import { type FC, useRef, type ChangeEvent, useState } from 'react';
import { MenuItem, ListItemIcon, ListItemText } from '@mui/material';
import { FileUpload } from '@mui/icons-material';
import { ImportConfirmDialog } from '../feedback/ImportConfirmDialog';

type Props = {
  onImport: (data: unknown) => void;
};

export const ImportMenuItem: FC<Props> = ({ onImport }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [pendingData, setPendingData] = useState<unknown | null>(null);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        setPendingData(json);
        setOpen(true);
      } catch (error) {
        console.error('Failed to parse JSON', error);
        alert('ファイルの読み込みに失敗しました。正しいJSONファイルを選択してください。');
      }
    };
    reader.readAsText(file);

    // 同じファイルを再度選択できるように値をリセット
    event.target.value = '';
  };

  const handleConfirm = () => {
    if (pendingData) {
      onImport(pendingData);
    }
    setOpen(false);
    setPendingData(null);
  };

  const handleClose = () => {
    setOpen(false);
    setPendingData(null);
  };

  return (
    <>
      <MenuItem onClick={handleClick}>
        <ListItemIcon>
          <FileUpload fontSize='small' />
        </ListItemIcon>
        <ListItemText>設定をインポート</ListItemText>
      </MenuItem>
      <input
        type='file'
        ref={fileInputRef}
        style={{ display: 'none' }}
        accept='.json'
        onChange={handleFileChange}
      />
      <ImportConfirmDialog open={open} onConfirm={handleConfirm} onClose={handleClose} />
    </>
  );
};
