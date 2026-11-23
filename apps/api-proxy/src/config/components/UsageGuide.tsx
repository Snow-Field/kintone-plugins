import { type FC, useState } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { Box, Button, Paper, Typography } from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { FormSection, Text } from '@kintone-plugin/ui';
import { PLUGIN_ID, type PluginConfig } from '@/shared/config';
import { callExample } from '@/shared/lib/targets';
import { InfoTip } from './InfoTip';

/** コピーのボタン。コピーできたかを、ボタンの文字で知らせる */
const CopyButton: FC<{ text: string; label: string }> = ({ text, label }) => {
  const [state, setState] = useState<'idle' | 'done' | 'failed'>('idle');
  return (
    <Button
      size='small'
      startIcon={<ContentCopyIcon />}
      onClick={() => {
        navigator.clipboard.writeText(text).then(
          () => setState('done'),
          // 権限などでコピーできないこともあるので、手で選んでもらう
          () => setState('failed')
        );
      }}
    >
      {state === 'done' ? 'コピーしました' : state === 'failed' ? 'コピーできませんでした' : label}
    </Button>
  );
};

const Code: FC<{ children: string }> = ({ children }) => (
  <Paper
    variant='outlined'
    component='pre'
    sx={{ p: 1.5, m: 0, overflowX: 'auto', fontSize: 13, fontFamily: 'monospace' }}
  >
    {children}
  </Paper>
);

const USAGE_TIPS = [
  'JS カスタマイズや他のプラグインから、このプラグインの ID を指定して kintone.plugin.app.proxy を呼びます',
  '登録した URL で始まり、メソッドが同じリクエストに、ヘッダーと本文の値が付きます',
  'proxy はレコードの画面（一覧・詳細・追加・編集など）でだけ使えます。試すのもレコードの画面で行います',
];

/** 使い方タブ */
export const UsageGuide: FC = () => {
  const { control } = useFormContext<PluginConfig>();
  const targets = useWatch({ control, name: 'targets' }) ?? [];

  return (
    <FormSection>
      <Text variant='sectionTitle'>
        使い方 <InfoTip label='使い方の説明' lines={USAGE_TIPS} />
      </Text>

      <Typography variant='subtitle2'>プラグイン ID</Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography component='code' sx={{ fontFamily: 'monospace' }}>
          {PLUGIN_ID}
        </Typography>
        <CopyButton text={PLUGIN_ID} label='コピー' />
      </Box>

      <Typography variant='subtitle2' sx={{ mt: 3, mb: 1 }}>
        呼び出しの例
      </Typography>
      {targets.length === 0 && (
        <Text variant='description'>接続先を登録すると、ここに接続先ごとの例が出ます。</Text>
      )}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {targets.map((target, i) => {
          const example = callExample(PLUGIN_ID, target);
          return (
            <Box key={target.id}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                <Typography variant='body2' sx={{ flex: 1 }}>
                  {`接続先 ${i + 1}${target.memo ? `（${target.memo}）` : ''}`}
                </Typography>
                <CopyButton text={example} label='例をコピー' />
              </Box>
              <Code>{example}</Code>
            </Box>
          );
        })}
      </Box>
    </FormSection>
  );
};
