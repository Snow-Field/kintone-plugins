import type { FC } from 'react';
import { useFieldArray, useFormContext, useWatch } from 'react-hook-form';
import { nanoid } from 'nanoid';
import { Alert, Box, Button } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { FormSection, Text } from '@kintone-plugin/ui';
import { type PluginConfig, PROXY_METHODS, type Target } from '@/shared/config';
import { overlappingTargets } from '@/shared/lib/targets';
import { TargetCard } from './TargetCard';

const createTarget = (): Target => ({
  id: nanoid(),
  url: '',
  methods: [...PROXY_METHODS],
  headers: [],
  data: [],
  memo: '',
});

/** 接続先タブ */
export const TargetsSettings: FC = () => {
  const { control } = useFormContext<PluginConfig>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'targets',
    keyName: 'fieldKey',
  });
  const targets = useWatch({ control, name: 'targets' }) ?? [];
  const overlaps = overlappingTargets(targets);

  return (
    <FormSection>
      <Text variant='sectionTitle'>接続先</Text>
      <Text variant='description'>
        登録したヘッダーと本文の値は、アプリの利用者には見えない場所（プロキシ設定）に保存し、kintone.plugin.app.proxy
        のリクエストに kintone のサーバーが付けます。保存後は「アプリを更新」で反映します。
      </Text>
      <Alert severity='warning' sx={{ my: 2 }}>
        値は見えませんが、アプリを開ける利用者は誰でも、登録した URL
        とメソッドの範囲で、その値の権限を使えます。kintone の API
        トークンは利用者本人の権限とは別に働くので、閲覧の権限が無いレコードも読めます。トークンの権限は必要なものだけにし、アプリ管理の権限は付けないでください。
      </Alert>

      {overlaps.map(([a, b]) => (
        <Alert key={`${a}-${b}`} severity='info' sx={{ mb: 2 }}>
          {`接続先 ${a + 1} と ${b + 1} は、URL の前方一致が重なっています。両方に当てはまるリクエストでは、長く一致した接続先の値が優先されます。`}
        </Alert>
      ))}

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {fields.map((field, i) => (
          <TargetCard key={field.fieldKey} index={i} onRemove={() => remove(i)} />
        ))}
      </Box>
      {fields.length === 0 && <Text variant='description'>接続先はまだありません。</Text>}
      <Button
        variant='outlined'
        startIcon={<AddIcon />}
        onClick={() => append(createTarget())}
        sx={{ mt: 2, py: 1, width: '100%', borderStyle: 'dashed' }}
      >
        接続先を足す
      </Button>
    </FormSection>
  );
};
