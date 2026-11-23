import type { FC } from 'react';
import { useFieldArray, useFormContext, useWatch } from 'react-hook-form';
import { nanoid } from 'nanoid';
import { Alert, Box, Button } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { FormSection, Text } from '@kintone-plugin/ui';
import { type PluginConfig, PROXY_METHODS, type Target } from '@/shared/config';
import { overlappingTargets } from '@/shared/lib/targets';
import { InfoTip } from './InfoTip';
import { TargetCard } from './TargetCard';

const createTarget = (): Target => ({
  id: nanoid(),
  url: '',
  methods: [...PROXY_METHODS],
  headers: [],
  data: [],
  memo: '',
});

const ABOUT_TIPS = [
  'ヘッダーと本文の値は、利用者には見えない場所（プロキシ設定）に保存します',
  'JS カスタマイズなどから kintone.plugin.app.proxy を呼ぶと、kintone のサーバーが値を付けて送ります',
  '保存したあと「アプリを更新」で反映します',
];

const RISK_TIPS = [
  'アプリを開ける利用者は、開発者ツールから proxy を呼べます',
  'kintone の API トークンは利用者本人の権限とは別に働くので、閲覧の権限が無いレコードも読めます',
  'トークンの権限は必要なものだけにし、アプリ管理の権限は付けないでください',
  '絞りたいときは、URL をパスまで具体的にし、メソッドを減らします',
];

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
      <Text variant='sectionTitle'>
        接続先 <InfoTip label='接続先の説明' lines={ABOUT_TIPS} />
      </Text>
      <Alert
        severity='warning'
        sx={{ mb: 2, alignItems: 'center' }}
        action={<InfoTip label='権限についての説明' lines={RISK_TIPS} />}
      >
        値は隠せますが、アプリの利用者は登録した範囲でその権限を使えます
      </Alert>

      {overlaps.map(([a, b]) => (
        <Alert key={`${a}-${b}`} severity='info' sx={{ mb: 2 }}>
          {`接続先 ${a + 1} と ${b + 1} は URL が前方一致で重なっています（長く一致した方の値が優先されます）`}
        </Alert>
      ))}

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {fields.map((field, i) => (
          <TargetCard key={field.fieldKey} index={i} onRemove={() => remove(i)} />
        ))}
      </Box>
      <Button
        variant='outlined'
        startIcon={<AddIcon />}
        onClick={() => append(createTarget())}
        sx={{ mt: fields.length > 0 ? 2 : 0, py: 1, width: '100%', borderStyle: 'dashed' }}
      >
        接続先を足す
      </Button>
    </FormSection>
  );
};
