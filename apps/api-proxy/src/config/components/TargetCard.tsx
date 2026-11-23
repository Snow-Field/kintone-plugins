import type { FC } from 'react';
import { useFormContext } from 'react-hook-form';
import { Box, Divider, IconButton, Paper, Typography } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { FormTextField, FormToggleButtonGroup } from '@kintone-plugin/ui';
import { type PluginConfig, PROXY_METHODS } from '@/shared/config';
import { DataEditor } from './DataEditor';
import { HeaderEditor } from './HeaderEditor';
import { InfoTip } from './InfoTip';
import { KintoneUrlButton } from './KintoneUrlButton';

const METHOD_OPTIONS = PROXY_METHODS.map((m) => ({ value: m, label: m }));

const URL_TIPS = [
  'この URL で始まり、選んだメソッドのリクエストに、ヘッダーと本文の値が付きます',
  '絞りたいときは、パスまで具体的に書きます（例：…/k/v1/records.json）',
  'URL は利用者からも見えるので、秘密を含めないでください',
];

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
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
        <Typography
          sx={{ fontWeight: 600, whiteSpace: 'nowrap' }}
        >{`接続先 ${index + 1}`}</Typography>
        <FormTextField<PluginConfig>
          name={`${base}.memo`}
          placeholder='メモ（利用者からも見えます）'
          slotProps={{ htmlInput: { 'aria-label': 'メモ' } }}
          size='small'
          variant='standard'
          sx={{ flex: 1 }}
        />
        <IconButton aria-label={`接続先 ${index + 1} を削除`} onClick={onRemove}>
          <DeleteIcon />
        </IconButton>
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, flexWrap: 'wrap' }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5, flex: 1, minWidth: 360 }}>
          <FormTextField<PluginConfig>
            name={`${base}.url`}
            label='URL（前方一致）'
            placeholder='https://example.com/api/'
            size='small'
            fullWidth
          />
          <Box sx={{ pt: 0.75 }}>
            <InfoTip label='URL の説明' lines={URL_TIPS} />
          </Box>
          <Box sx={{ pt: 0.5 }}>
            <KintoneUrlButton
              onSelect={(url) =>
                setValue(`${base}.url`, url, { shouldDirty: true, shouldValidate: true })
              }
            />
          </Box>
        </Box>
        <FormToggleButtonGroup<PluginConfig>
          name={`${base}.methods`}
          label='メソッド'
          options={METHOD_OPTIONS}
        />
      </Box>

      <Divider sx={{ my: 2 }} />
      <HeaderEditor targetIndex={index} />
      <Divider sx={{ my: 2 }} />
      <DataEditor targetIndex={index} />
    </Paper>
  );
};
