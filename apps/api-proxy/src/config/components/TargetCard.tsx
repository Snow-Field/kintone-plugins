import type { FC } from 'react';
import { useFormContext } from 'react-hook-form';
import { Box, Divider, IconButton, Paper, Typography } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { FormAutocomplete, FormTextField } from '@kintone-plugin/ui';
import { type PluginConfig, PROXY_METHODS } from '@/shared/config';
import { DataEditor } from './DataEditor';
import { HeaderEditor } from './HeaderEditor';
import { KintoneUrlButton } from './KintoneUrlButton';

const METHOD_OPTIONS = PROXY_METHODS.map((m) => ({ value: m, label: m }));

type Props = {
  index: number;
  onRemove: () => void;
};

/** 接続先1件の入力 */
export const TargetCard: FC<Props> = ({ index, onRemove }) => {
  const { setValue } = useFormContext<PluginConfig>();
  const base = `targets.${index}` as const;

  return (
    <Paper variant='outlined' sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Typography variant='subtitle1' sx={{ flex: 1, fontWeight: 600 }}>
          {`接続先 ${index + 1}`}
        </Typography>
        <IconButton aria-label={`接続先 ${index + 1} を削除`} onClick={onRemove}>
          <DeleteIcon />
        </IconButton>
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
        <FormTextField<PluginConfig>
          name={`${base}.url`}
          label='URL（前方一致）'
          placeholder='https://example.com/api/'
          size='small'
          sx={{ flex: 1 }}
        />
        <Box sx={{ pt: 0.5 }}>
          <KintoneUrlButton
            onSelect={(url) =>
              setValue(`${base}.url`, url, { shouldDirty: true, shouldValidate: true })
            }
          />
        </Box>
      </Box>
      <Typography variant='caption' sx={{ display: 'block', mt: 0.5, color: 'text.secondary' }}>
        この URL
        で始まるリクエストに、下のヘッダーと本文の値が付きます。絞りたいときは、パスまで具体的に書いてください（例：…/k/v1/records.json）。
      </Typography>

      <Box sx={{ mt: 2, maxWidth: 480 }}>
        <FormAutocomplete<PluginConfig>
          name={`${base}.methods`}
          label='メソッド'
          options={METHOD_OPTIONS}
          multiple
          size='small'
        />
      </Box>

      <Divider sx={{ my: 2 }} />
      <HeaderEditor targetIndex={index} />
      <Divider sx={{ my: 2 }} />
      <DataEditor targetIndex={index} />
      <Divider sx={{ my: 2 }} />

      <FormTextField<PluginConfig>
        name={`${base}.memo`}
        label='メモ（利用者からも見えます。秘密を書かないでください）'
        size='small'
        fullWidth
      />
    </Paper>
  );
};
