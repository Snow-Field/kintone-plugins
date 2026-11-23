import type { FC } from 'react';
import { type FieldError, useFormContext, useFormState, useWatch } from 'react-hook-form';
import { nanoid } from 'nanoid';
import { Box, IconButton, TableCell, TableRow } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
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
  index: number;
  onRemove: () => void;
};

/** 接続先1件（表の1行） */
export const TargetRow: FC<Props> = ({ index, onRemove }) => {
  const { control, getValues, setValue } = useFormContext<PluginConfig>();
  const base = `targets.${index}` as const;
  const headers = useWatch({ control, name: `${base}.headers` }) ?? [];
  const data = useWatch({ control, name: `${base}.data` }) ?? [];
  const { errors } = useFormState({ control, name: base });
  const targetErrors = errors.targets?.[index];
  const headerKeys = headers.map((h) => h.key);
  const dataKeys = data.map((d) => d.key);
  const setOptions = { shouldDirty: true, shouldValidate: true } as const;

  return (
    <TableRow sx={{ verticalAlign: 'top', '& > td': { py: 1.5 } }}>
      <TableCell sx={{ pt: '20px !important', color: 'text.secondary' }}>{index + 1}</TableCell>
      <TableCell sx={{ minWidth: 320 }}>
        <FormTextField<PluginConfig>
          name={`${base}.url`}
          placeholder='https://example.com/api/'
          size='small'
          fullWidth
          slotProps={{ htmlInput: { 'aria-label': `接続先 ${index + 1} の URL` } }}
        />
        <KintoneUrlButton onSelect={(url) => setValue(`${base}.url`, url, setOptions)} />
      </TableCell>
      <TableCell>
        <FormToggleButtonGroup<PluginConfig>
          name={`${base}.methods`}
          label={`接続先 ${index + 1} のメソッド`}
          options={METHOD_OPTIONS}
        />
      </TableCell>
      <TableCell sx={{ minWidth: 200 }}>
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
      <TableCell sx={{ minWidth: 200 }}>
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
      <TableCell sx={{ minWidth: 140 }}>
        <FormTextField<PluginConfig>
          name={`${base}.memo`}
          placeholder='メモ'
          size='small'
          fullWidth
          slotProps={{ htmlInput: { 'aria-label': `接続先 ${index + 1} のメモ` } }}
        />
      </TableCell>
      <TableCell sx={{ width: 48 }}>
        <Box sx={{ pt: 0.25 }}>
          <IconButton aria-label={`接続先 ${index + 1} を削除`} onClick={onRemove}>
            <DeleteIcon />
          </IconButton>
        </Box>
      </TableCell>
    </TableRow>
  );
};
