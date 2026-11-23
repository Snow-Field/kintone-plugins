import { type FC, useState } from 'react';
import { Alert, AlertTitle, Box, Button, Paper, Typography } from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { FormSection, Text } from '@kintone-plugin/ui';
import { PLUGIN_ID } from '@/shared/config';
import { TitleWithTip } from './InfoTip';

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

const USAGE_TIPS = [
  'JS カスタマイズや他のプラグインから、このプラグインの ID を指定して kintone.plugin.app.proxy を呼びます',
  '登録した URL で始まり、メソッドが同じリクエストに、ヘッダーとデータが付きます',
  'proxy はレコードの画面（一覧・詳細・追加・編集など）でだけ使えます',
];

const RISK_LINES = [
  'アプリを開ける利用者は、開発者ツールから proxy を呼べます',
  'kintone の API トークンは利用者本人の権限とは別に働くので、閲覧の権限が無いレコードも読めます',
  'トークンの権限は必要なものだけにし、アプリ管理の権限は付けないでください',
  '絞りたいときは、URL をパスまで具体的にし、メソッドを減らします',
];

/**
 * 呼び出しの例（レコード一覧の画面で、kintone の REST API からレコードを取得する）
 * JS カスタマイズのファイルにそのまま貼れるよう、レコードの画面のイベントの中で呼ぶ（proxy はレコードの画面でだけ使える）
 */
const EXAMPLE = [
  `const PLUGIN_ID = ${JSON.stringify(PLUGIN_ID)};`,
  ``,
  `kintone.events.on('app.record.index.show', async (event) => {`,
  `  const url = kintone.api.url('/k/v1/records.json', true) + '?app=' + kintone.app.getId();`,
  `  const [body, status] = await kintone.plugin.app.proxy(PLUGIN_ID, url, 'GET', {}, {});`,
  `  // proxy は 4xx・5xx でも失敗にならないので、ステータスを確かめる`,
  `  if (status < 200 || status >= 300) throw new Error(body);`,
  `  const { records } = JSON.parse(body);`,
  `  console.log(records);`,
  `  return event;`,
  `});`,
].join('\n');

/** 使い方タブ */
export const UsageGuide: FC = () => (
  <FormSection>
    <Text variant='sectionTitle'>
      <TitleWithTip title='使い方' label='使い方の説明' lines={USAGE_TIPS} />
    </Text>

    {/* 安全に関わるので、ⓘ に隠さず全文を出す */}
    <Alert severity='warning' sx={{ mb: 3 }}>
      <AlertTitle>値は隠せますが、アプリの利用者は登録した範囲でその権限を使えます</AlertTitle>
      <Box component='ul' sx={{ m: 0, pl: 2.5, '& > li': { listStyle: 'disc' } }}>
        {RISK_LINES.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </Box>
    </Alert>

    <Typography variant='subtitle2'>プラグイン ID</Typography>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Typography component='code' sx={{ fontFamily: 'monospace' }}>
        {PLUGIN_ID}
      </Typography>
      <CopyButton text={PLUGIN_ID} label='コピー' />
    </Box>

    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 3, mb: 0.5 }}>
      <Typography variant='subtitle2' sx={{ flex: 1 }}>
        呼び出しの例（kintone のレコードを取得する）
      </Typography>
      <CopyButton text={EXAMPLE} label='例をコピー' />
    </Box>
    <Paper
      variant='outlined'
      component='pre'
      sx={{ p: 1.5, m: 0, overflowX: 'auto', fontSize: 13, fontFamily: 'monospace' }}
    >
      {EXAMPLE}
    </Paper>
  </FormSection>
);
