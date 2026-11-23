import { type FC, useState } from 'react';
import { useFormContext, useFormState, useWatch } from 'react-hook-form';
import { nanoid } from 'nanoid';
import {
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
import type { PluginConfig } from '@/shared/config';
import { dataToJson, jsonToData } from '@/shared/lib/dataJson';
import { LabelWithTip } from './InfoTip';

type Props = { targetIndex: number };

const DATA_TIPS = [
  '固定したい値や、毎回送る値を書きます（任意）',
  'GET・DELETE：URL のクエリ文字列に足されます。呼び出し側の同じキーは消えないので、固定はできません',
  'POST・PUT：呼び出し側の本文がオブジェクトのときに足され、同じキーは保存した値が優先されます',
  '本文を文字列（JSON.stringify など）で渡すと足されません',
];

/**
 * 本文の値。ふだんはキーの一覧だけを出し（値は伏せる）、編集はダイアログで JSON をまとめて書く
 * 種類（文字・数値・真偽）は JSON の値から決まる
 */
export const DataEditor: FC<Props> = ({ targetIndex }) => {
  const { control, getValues, setValue } = useFormContext<PluginConfig>();
  const name = `targets.${targetIndex}.data` as const;
  const items = useWatch({ control, name }) ?? [];
  const { errors } = useFormState({ control, name });
  // 行ごとの入力欄が無いので、行の検証エラーを「キー: 理由」の一覧にして出す
  const dataErrors = errors.targets?.[targetIndex]?.data;
  const errorLines = Array.isArray(dataErrors)
    ? dataErrors.flatMap((rowError, i) => {
        if (!rowError) return [];
        const message = rowError.key?.message ?? rowError.value?.message;
        return message ? [`${items[i]?.key || `${i + 1}番目`}: ${message}`] : [];
      })
    : [];

  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [message, setMessage] = useState<string | null>(null);

  const openDialog = () => {
    setText(dataToJson(getValues(name)));
    setMessage(null);
    setOpen(true);
  };

  const apply = () => {
    const result = jsonToData(text, getValues(name), nanoid);
    if (!result.ok) {
      setMessage(result.message);
      return;
    }
    setValue(name, result.items, { shouldDirty: true, shouldValidate: true });
    setOpen(false);
  };

  return (
    <Box>
      <LabelWithTip title='本文の値' label='本文の値の説明' lines={DATA_TIPS} />
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography
          variant='body2'
          sx={{ flex: 1, color: items.length === 0 ? 'text.secondary' : 'text.primary' }}
        >
          {items.length === 0
            ? 'なし'
            : `${items.map((item) => item.key).join(', ')}（値は伏せています）`}
        </Typography>
        <Button size='small' startIcon={<EditIcon />} onClick={openDialog}>
          編集
        </Button>
      </Box>
      {errorLines.map((line) => (
        <Typography key={line} variant='caption' sx={{ display: 'block', color: 'error.main' }}>
          {line}
        </Typography>
      ))}

      <Dialog
        open={open}
        // 外を押しただけで閉じると、書きかけの JSON が消えるため、閉じるのはボタンと Esc だけにする
        onClose={(_, reason) => {
          if (reason !== 'backdropClick') setOpen(false);
        }}
        fullWidth
        maxWidth='sm'
      >
        <DialogTitle>本文の値</DialogTitle>
        <DialogContent>
          <Typography variant='body2' sx={{ mb: 1.5, color: 'text.secondary' }}>
            {
              '{ "キー": 値 } の形で書きます。値は文字・数値・true / false のどれかです。同じキーを2回書くと、後の値だけが使われます。'
            }
          </Typography>
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
            placeholder={'{\n  "channel": "C01234",\n  "limit": 100\n}'}
            error={message !== null}
            helperText={message ?? ' '}
            slotProps={{ htmlInput: { 'aria-label': '本文の値（JSON）' } }}
            sx={{ '& textarea': { fontFamily: 'monospace' } }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>キャンセル</Button>
          <Button variant='contained' onClick={apply}>
            反映する
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
