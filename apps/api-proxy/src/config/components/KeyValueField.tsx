import { type FC, type ReactNode, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';

type ParseResult = { ok: true } | { ok: false; message: string };

type Props = {
  /** ダイアログの見出し（例: 'ヘッダー'） */
  title: string;
  /** 編集ボタンの読み上げ名（行ごとに区別できるように、接続先の番号を入れる） */
  editLabel: string;
  /** 登録済みのキー（一覧に出す。値は出さない） */
  keys: string[];
  /** 行の検証エラー（「キー: 理由」の形） */
  errors: string[];
  /** ダイアログを開いたときの JSON。warning はダイアログに出す注意（同じキーが複数あるときなど） */
  toJson: () => { text: string; warning?: string };
  /** JSON を反映する。だめなら理由を返す */
  apply: (text: string) => ParseResult;
  /** ダイアログの説明 */
  description: string;
  placeholder: string;
  /** ダイアログの下に足す操作（例: kintone API トークンを追加）。今の JSON を受け取り、新しい JSON か理由を返す */
  extraAction?: {
    label: string;
    icon?: ReactNode;
    run: (text: string) => { ok: true; text: string } | { ok: false; message: string };
  };
};

/**
 * キーと値の入力。ふだんはキーの一覧だけを出し（値は伏せる）、編集はダイアログで JSON をまとめて書く
 * ダイアログは、外を押しても閉じない（書きかけの JSON が消えるため）。閉じるのはボタンと Esc だけ
 */
export const KeyValueField: FC<Props> = ({
  title,
  editLabel,
  keys,
  errors,
  toJson,
  apply,
  description,
  placeholder,
  extraAction,
}) => {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | undefined>();

  const openDialog = () => {
    const initial = toJson();
    setText(initial.text);
    setWarning(initial.warning);
    setMessage(null);
    setOpen(true);
  };

  const submit = () => {
    const result = apply(text);
    if (!result.ok) {
      setMessage(result.message);
      return;
    }
    setOpen(false);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <Typography
          variant='body2'
          sx={{
            flex: 1,
            minWidth: 0,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            color: keys.length === 0 ? 'text.secondary' : 'text.primary',
          }}
          title={keys.join(', ')}
        >
          {keys.length === 0 ? 'なし' : keys.join(', ')}
        </Typography>
        <Button
          size='small'
          startIcon={<EditIcon />}
          onClick={openDialog}
          aria-label={editLabel}
          sx={{ flexShrink: 0 }}
        >
          編集
        </Button>
      </Box>
      {/* 同じ文は並べても情報が増えないので1つにする（文をそのまま key にできる） */}
      {[...new Set(errors)].map((line) => (
        <Typography key={line} variant='caption' sx={{ display: 'block', color: 'error.main' }}>
          {line}
        </Typography>
      ))}

      <Dialog
        open={open}
        onClose={(_, reason) => {
          if (reason !== 'backdropClick') setOpen(false);
        }}
        fullWidth
        maxWidth='sm'
      >
        <DialogTitle>{title}</DialogTitle>
        <DialogContent>
          <Typography variant='body2' sx={{ mb: 1.5, color: 'text.secondary' }}>
            {description}
          </Typography>
          {warning && (
            <Alert severity='warning' sx={{ mb: 1.5 }}>
              {warning}
            </Alert>
          )}
          <TextField
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              setMessage(null);
            }}
            multiline
            minRows={6}
            fullWidth
            autoFocus
            spellCheck={false}
            placeholder={placeholder}
            error={message !== null}
            helperText={message ?? ' '}
            slotProps={{ htmlInput: { 'aria-label': `${title}（JSON）` } }}
            sx={{ '& textarea': { fontFamily: 'monospace' } }}
          />
          {extraAction && (
            <Button
              size='small'
              startIcon={extraAction.icon}
              onClick={() => {
                const result = extraAction.run(text);
                if (result.ok) {
                  setText(result.text);
                  setMessage(null);
                } else setMessage(result.message);
              }}
            >
              {extraAction.label}
            </Button>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>キャンセル</Button>
          <Button variant='contained' onClick={submit}>
            反映する
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
