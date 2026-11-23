import type { FC } from 'react';
import { useFieldArray, useFormContext, useWatch } from 'react-hook-form';
import { nanoid } from 'nanoid';
import { Box, Button, IconButton, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import KeyIcon from '@mui/icons-material/Key';
import { FormSecretField, FormTextField } from '@kintone-plugin/ui';
import type { PluginConfig } from '@/shared/config';
import { API_TOKEN_HEADER, isApiTokenHeader, MAX_API_TOKENS } from '@/shared/lib/targets';

type Props = { targetIndex: number };

/** ヘッダーの入力。キーは見えたまま、値は伏せ字にする */
export const HeaderEditor: FC<Props> = ({ targetIndex }) => {
  const { control } = useFormContext<PluginConfig>();
  const name = `targets.${targetIndex}.headers` as const;
  const { fields, append, remove } = useFieldArray({ control, name, keyName: 'fieldKey' });
  const headers = useWatch({ control, name }) ?? [];
  const hasTokenHeader = headers.some((h) => isApiTokenHeader(h.key));

  return (
    <Box>
      <Typography variant='subtitle2' sx={{ mb: 1 }}>
        ヘッダー
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {fields.map((field, i) => (
          <Box key={field.fieldKey} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
            <FormTextField<PluginConfig>
              name={`${name}.${i}.key`}
              label='キー'
              size='small'
              sx={{ width: 240 }}
            />
            <FormSecretField<PluginConfig>
              name={`${name}.${i}.value`}
              label='値'
              size='small'
              placeholder={
                isApiTokenHeader(headers[i]?.key ?? '') ? 'トークン1,トークン2' : undefined
              }
              sx={{ flex: 1 }}
            />
            <IconButton aria-label={`ヘッダー ${i + 1} を削除`} onClick={() => remove(i)}>
              <DeleteIcon />
            </IconButton>
          </Box>
        ))}
      </Box>
      {hasTokenHeader && (
        <Typography variant='caption' sx={{ display: 'block', mt: 0.5, color: 'text.secondary' }}>
          {`複数のアプリを扱うとき（ルックアップ元のアプリを含む）は、トークンをカンマ区切りで${MAX_API_TOKENS}個まで書けます。`}
        </Typography>
      )}
      <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
        <Button
          size='small'
          startIcon={<AddIcon />}
          onClick={() => append({ id: nanoid(), key: '', value: '' })}
        >
          ヘッダーを足す
        </Button>
        <Button
          size='small'
          startIcon={<KeyIcon />}
          onClick={() => append({ id: nanoid(), key: API_TOKEN_HEADER, value: '' })}
          disabled={hasTokenHeader}
        >
          kintone の API トークンを足す
        </Button>
      </Box>
    </Box>
  );
};
