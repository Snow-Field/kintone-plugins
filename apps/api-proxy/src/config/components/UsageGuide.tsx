import { type FC, useState } from 'react';
import { Alert, AlertTitle, Box, Button, Paper, Typography } from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { FormSection } from '@kintone-plugin/ui';
import { PLUGIN_ID } from '@/shared/config';

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

const STEPS = [
  '「接続先」タブで、接続先の URL・メソッド・ヘッダー（API トークンなど）を登録します。',
  '「設定を保存」を押し、アプリの設定画面で「アプリを更新」を押します。',
  'アプリの JS カスタマイズなどから、下のプラグイン ID を指定して kintone.plugin.app.proxy を呼びます（呼び出しの例を参考にしてください）。',
];

const CONDITIONS = [
  '呼び出した URL が、登録した URL で始まる',
  'メソッドが、登録したメソッドのどれかと同じ',
  'このプラグインを追加したアプリの、レコードの画面（一覧・詳細・追加・編集など）から呼んでいる',
];

const RISKS = [
  'アプリを開ける利用者は、ブラウザの開発者ツールから kintone.plugin.app.proxy を実行できます。',
];

const MEASURES = [
  'API トークンの権限は、用途に必要な最低限にしてください。',
  '使う API が決まっているときは、URL をパスまで具体的にし（例：…/k/v1/records.json）、メソッドも必要なものだけにします。',
  'URL・説明・ヘッダーとデータのキー名は、利用者からも見えます（値は見えません）。秘密情報は書かないでください。',
];

/** 見出し */
const Heading: FC<{ children: string; first?: boolean }> = ({ children, first }) => (
  <Typography sx={{ fontWeight: 600, fontSize: 15, mt: first ? 0 : 3, mb: 1 }}>
    {children}
  </Typography>
);

/** 箇条書き（kintone の CSS で記号が消えるので、記号を指定する） */
const List: FC<{ items: string[]; ordered?: boolean }> = ({ items, ordered }) => (
  <Box
    component={ordered ? 'ol' : 'ul'}
    sx={{
      m: 0,
      pl: 3,
      '& > li': { listStyle: ordered ? 'decimal' : 'disc', mb: 0.75, lineHeight: 1.7 },
    }}
  >
    {items.map((item) => (
      <li key={item}>{item}</li>
    ))}
  </Box>
);

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

/** 使い方タブ（設定する管理者へのヘルプ） */
export const UsageGuide: FC = () => (
  <FormSection>
    <Heading first>API プロキシ設定プラグイン</Heading>
    <Typography sx={{ lineHeight: 1.7 }}>
      API トークンなどの秘密情報を、アプリの利用者からは見えない場所（kintone
      のプロキシ設定）に保存します。
    </Typography>
    <Typography sx={{ lineHeight: 1.7 }}>
      JS カスタマイズや他のプラグインから kintone.plugin.app.proxy を呼ぶと、kintone
      のサーバーが保存した値をリクエストに付けて送ります。
    </Typography>

    <Heading>使い方</Heading>
    <List items={STEPS} ordered />

    <Heading>ヘッダーとデータが送られる条件</Heading>
    <Typography sx={{ mb: 1, lineHeight: 1.7 }}>
      次のすべてに当てはまるリクエストに、登録したヘッダーとデータが付きます。
    </Typography>
    <List items={CONDITIONS} />

    <Heading>注意</Heading>
    <Alert severity='warning'>
      <AlertTitle>値は見えませんが、利用者は登録した範囲でその権限を使えます</AlertTitle>
      {/* 起こりうることと対策を、同じ階層・同じ間隔の1つの箇条書きにする */}
      <List items={[...RISKS, ...MEASURES]} />
    </Alert>

    <Heading>プラグイン ID</Heading>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Typography component='code' sx={{ fontFamily: 'monospace' }}>
        {PLUGIN_ID}
      </Typography>
      <CopyButton text={PLUGIN_ID} label='コピー' />
    </Box>

    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 3, mb: 1 }}>
      <Typography sx={{ fontWeight: 600, fontSize: 15, flex: 1 }}>
        呼び出しの例（レコード一覧の画面で、このアプリのレコードを取得する）
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
