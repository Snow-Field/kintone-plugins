import type { FC } from 'react';
import { type FieldError, useFormContext, useFormState, useWatch } from 'react-hook-form';
import { nanoid } from 'nanoid';
import { useSortable } from '@dnd-kit/sortable';
import { Box, IconButton, TableCell, TableRow, Tooltip } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import KeyIcon from '@mui/icons-material/Key';
import { FormTextField, FormToggleButtonGroup } from '@kintone-plugin/ui';
import { type PluginConfig, PROXY_METHODS } from '@/shared/config';
import {
  addHeaderKey,
  dataToJson,
  duplicatedKeys,
  headersToJson,
  jsonToData,
  jsonToHeaders,
} from '@/shared/lib/keyValueJson';
import { API_TOKEN_HEADER } from '@/shared/lib/targets';
import { KeyValueField } from './KeyValueField';
import { KintoneUrlButton } from './KintoneUrlButton';

const METHOD_OPTIONS = PROXY_METHODS.map((m) => ({ value: m, label: m }));

type RowErrors = ({ key?: FieldError; value?: FieldError } | undefined)[] | undefined;

/** 行ごとの検証エラーを「キー: 理由」の一覧にする（行ごとの入力欄が無いため。キーと値の両方の誤りを出す） */
const toErrorLines = (rowErrors: RowErrors, keys: string[]): string[] =>
  Array.isArray(rowErrors)
    ? rowErrors.flatMap((rowError, i) =>
        [rowError?.key?.message, rowError?.value?.message]
          .filter((message): message is string => Boolean(message))
          .map((message) => `${keys[i] || `${i + 1}番目`}: ${message}`)
      )
    : [];

/** 同じキーの行が複数あるときの注意（JSON にすると最後の値だけが残る） */
const duplicateWarning = (items: { key: string }[]): string | undefined => {
  const keys = duplicatedKeys(items);
  return keys.length === 0
    ? undefined
    : `同じキー（${keys.join(', ')}）が複数ありました。最後の値だけを出しています。反映すると、ほかの値は消えます。`;
};

type Props = {
  /** 並べ替えの識別子（useFieldArray の行の key） */
  sortableId: string;
  index: number;
  /** この行の後ろに接続先を足す */
  onInsertAfter: () => void;
  onRemove: () => void;
};

/** 接続先1件（表の1行） */
export const TargetRow: FC<Props> = ({ sortableId, index, onInsertAfter, onRemove }) => {
  const { control, getValues, setValue } = useFormContext<PluginConfig>();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: sortableId,
  });
  const base = `targets.${index}` as const;
  const url = useWatch({ control, name: `${base}.url` }) ?? '';
  const headers = useWatch({ control, name: `${base}.headers` }) ?? [];
  const data = useWatch({ control, name: `${base}.data` }) ?? [];
  const { errors } = useFormState({ control, name: base });
  const targetErrors = errors.targets?.[index];
  const headerKeys = headers.map((h) => h.key);
  const dataKeys = data.map((d) => d.key);
  const setOptions = { shouldDirty: true, shouldValidate: true } as const;

  return (
    <TableRow
      ref={setNodeRef}
      // 並べ替えの動きは dnd-kit が毎フレーム計算するので、sx ではなく style で渡す
      style={{
        transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
        transition,
      }}
      sx={{
        verticalAlign: 'top',
        position: 'relative',
        zIndex: isDragging ? 1 : 'auto',
        bgcolor: isDragging ? 'action.hover' : undefined,
        '& > td': { py: 1.5 },
      }}
    >
      <TableCell sx={{ px: 0.5, whiteSpace: 'nowrap' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', height: 40, color: 'text.secondary' }}>
          <Tooltip title='ドラッグして並べ替え'>
            <IconButton
              {...attributes}
              {...listeners}
              size='small'
              aria-label={`接続先 ${index + 1} を並べ替え`}
              sx={{ cursor: 'grab', color: 'text.disabled' }}
            >
              <DragIndicatorIcon fontSize='small' />
            </IconButton>
          </Tooltip>
          {index + 1}
        </Box>
      </TableCell>
      <TableCell sx={{ width: '40%', minWidth: 320 }}>
        {/* 長い URL は欄に収まらないので、カーソルを乗せたときに全体を出す */}
        <Tooltip title={url} placement='top-start' disableHoverListener={url.length < 40}>
          <Box>
            <FormTextField<PluginConfig>
              name={`${base}.url`}
              placeholder='https://example.com/api/'
              size='small'
              fullWidth
              slotProps={{ htmlInput: { 'aria-label': `接続先 ${index + 1} の URL` } }}
            />
          </Box>
        </Tooltip>
        <KintoneUrlButton onSelect={(url) => setValue(`${base}.url`, url, setOptions)} />
      </TableCell>
      <TableCell>
        <FormToggleButtonGroup<PluginConfig>
          name={`${base}.methods`}
          label={`接続先 ${index + 1} のメソッド`}
          options={METHOD_OPTIONS}
        />
      </TableCell>
      <TableCell sx={{ minWidth: 170 }}>
        <KeyValueField
          title='ヘッダー'
          editLabel={`接続先 ${index + 1} のヘッダーを編集`}
          keys={headerKeys}
          errors={toErrorLines(targetErrors?.headers as RowErrors, headerKeys)}
          toJson={() => {
            const current = getValues(`${base}.headers`);
            return { text: headersToJson(current), warning: duplicateWarning(current) };
          }}
          apply={(text) => {
            const result = jsonToHeaders(text, getValues(`${base}.headers`), nanoid);
            if (result.ok) setValue(`${base}.headers`, result.items, setOptions);
            return result;
          }}
          description={`{ "キー": "値" } の形で書きます。kintone のトークンはキー ${API_TOKEN_HEADER} に、複数ならカンマ区切りで書きます。`}
          placeholder={`{\n  "${API_TOKEN_HEADER}": "トークン"\n}`}
          extraAction={{
            label: 'kintone API トークンを追加',
            icon: <KeyIcon />,
            run: (text) => addHeaderKey(text, API_TOKEN_HEADER),
          }}
        />
      </TableCell>
      <TableCell sx={{ minWidth: 150 }}>
        <KeyValueField
          title='本文の値'
          editLabel={`接続先 ${index + 1} の本文の値を編集`}
          keys={dataKeys}
          errors={toErrorLines(targetErrors?.data as RowErrors, dataKeys)}
          toJson={() => {
            const current = getValues(`${base}.data`);
            return { text: dataToJson(current), warning: duplicateWarning(current) };
          }}
          apply={(text) => {
            const result = jsonToData(text, getValues(`${base}.data`), nanoid);
            if (result.ok) setValue(`${base}.data`, result.items, setOptions);
            return result;
          }}
          description='{ "キー": 値 } の形で書きます。値は文字・数値・true / false のどれかです。同じキーを2回書くと、後の値だけが使われます。'
          placeholder={'{\n  "channel": "C01234",\n  "limit": 100\n}'}
        />
      </TableCell>
      <TableCell sx={{ width: 140, minWidth: 120 }}>
        <FormTextField<PluginConfig>
          name={`${base}.memo`}
          placeholder='メモ'
          size='small'
          fullWidth
          slotProps={{ htmlInput: { 'aria-label': `接続先 ${index + 1} のメモ` } }}
        />
      </TableCell>
      <TableCell sx={{ px: 0.5, whiteSpace: 'nowrap' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', height: 40 }}>
          <Tooltip title='この下に追加'>
            <IconButton aria-label={`接続先 ${index + 1} の下に追加`} onClick={onInsertAfter}>
              <AddIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title='削除'>
            <IconButton aria-label={`接続先 ${index + 1} を削除`} onClick={onRemove}>
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </TableCell>
    </TableRow>
  );
};
