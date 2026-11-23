import { type FC, useEffect } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { nanoid } from 'nanoid';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from '@mui/material';
import KeyIcon from '@mui/icons-material/Key';
import { FormTextField, FormToggleButtonGroup } from '@kintone-plugin/ui';
import { PROXY_METHODS, type Target } from '@/shared/config';
import { addHeaderKey } from '@/shared/lib/keyValueJson';
import {
  type DraftField,
  draftWarning,
  fromDraft,
  type TargetDraft,
  toDraft,
} from '@/shared/lib/targetDraft';
import { API_TOKEN_HEADER, MAX_API_TOKENS } from '@/shared/lib/targets';
import { TitleWithTip } from './InfoTip';
import { KintoneUrlButton } from './KintoneUrlButton';

const METHOD_OPTIONS = PROXY_METHODS.map((m) => ({ value: m, label: m }));

const URL_TIPS = [
  'この URL で始まるリクエストに値が付きます（例：…/k/v1/ を登録すると …/k/v1/records.json にも付く）',
];

const HEADER_TIPS = [
  'API トークンなど、リクエストのヘッダーに付ける値です。{ "キー": "値" } の形で書きます',
  `複数のアプリ（ルックアップ元を含む）は、カンマ区切りで${MAX_API_TOKENS}個まで書けます`,
];

const DATA_TIPS = [
  'リクエストに自動で足す値です（任意）。秘密情報や、利用者に変えさせたくない値だけを書きます',
  'レコードの更新内容など、呼び出すたびに変わる値は、呼び出し側の本文に書きます（ここに書く必要はありません）',
  '呼び出し側と同じキーを書くと、そのキーは丸ごと置き換わります（例：record を書くと、呼び出し側の record は送られません）',
  'GET・DELETE：URL の後ろに ?キー=値 として足されます。呼び出し側も同じキーを付けると両方が送られるので、値の固定には使えません',
  'POST・PUT：本文に足され、呼び出し側と同じキーなら保存した値で上書きします（送り先の固定などに使えます）。本文はオブジェクトで渡してください（文字列にすると足されません）',
];

const SAVE_TIPS = [
  '「保存」は一覧に戻すだけです',
  'kintone への保存は、画面右上の「設定を保存」で行います',
];

/** 見出し（ⓘ 付き） */
const FieldTitle: FC<{ title: string; tips?: string[] }> = ({ title, tips }) => (
  <Typography variant='subtitle2' sx={{ mb: 0.5 }}>
    {tips ? <TitleWithTip title={title} label={`${title}の説明`} lines={tips} /> : title}
  </Typography>
);

type Props = {
  /** 編集する接続先と、一覧での位置（追加なら入る位置） */
  editing: { target: Target; index: number; isNew: boolean };
  /** 編集中の接続先を除いた一覧（重なりの検証に使う） */
  others: Target[];
  onApply: (target: Target) => void;
  onClose: () => void;
};

/**
 * 接続先の編集ダイアログ
 * 一覧とは別のフォームで編集し、「保存」で検証してから一覧に戻す（キャンセルなら何も変えない）
 * 外を押しても閉じない（書きかけが消えるため）
 * 開くたびに作り直す（呼び出し側で key を変える）。前に開いた接続先の値が一瞬でも映らないよう、
 * フォームは最初から開いた接続先の値で作る
 */
export const TargetDialog: FC<Props> = ({ editing, others, onApply, onClose }) => {
  const methods = useForm<TargetDraft>({ defaultValues: toDraft(editing.target) });
  const { getValues, setValue, setError, clearErrors } = methods;
  const warning = draftWarning(editing.target);

  /** 検証し、誤りを欄に出す。誤りが無ければ接続先を返す */
  const validate = (): Target | null => {
    clearErrors();
    const result = fromDraft(getValues(), editing.target, others, editing.index, nanoid);
    if (result.ok) return result.target;
    for (const [field, message] of Object.entries(result.errors)) {
      setError(field as DraftField, { message });
    }
    return null;
  };

  // 既存の接続先は、開いた時点で検証して理由を出す（一覧の「要修正」の理由を確かめられるように）
  // biome-ignore lint/correctness/useExhaustiveDependencies: 開いたときに1回だけ行う
  useEffect(() => {
    if (!editing.isNew) validate();
  }, []);

  const apply = () => {
    const target = validate();
    if (target) onApply(target);
  };

  const addToken = () => {
    const result = addHeaderKey(getValues('headersText'), API_TOKEN_HEADER);
    if (result.ok) {
      setValue('headersText', result.text);
      clearErrors('headersText');
    } else setError('headersText', { message: result.message });
  };

  const setOptions = { shouldDirty: true } as const;

  return (
    <Dialog
      open
      onClose={(_, reason) => {
        if (reason !== 'backdropClick') onClose();
      }}
      fullWidth
      maxWidth='md'
    >
      <DialogTitle>
        <TitleWithTip
          title={editing.isNew ? '接続先を追加' : `接続先 ${editing.index + 1} を編集`}
          label='保存についての説明'
          lines={SAVE_TIPS}
        />
      </DialogTitle>
      <FormProvider {...methods}>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          {warning && <Alert severity='warning'>{warning}</Alert>}

          <Box>
            <FieldTitle title='説明' />
            <FormTextField<TargetDraft>
              name='memo'
              placeholder='何に使う接続先か（例：Slack への通知）'
              size='small'
              fullWidth
              slotProps={{ htmlInput: { 'aria-label': '説明' } }}
            />
          </Box>

          <Box>
            <FieldTitle title='URL' tips={URL_TIPS} />
            <FormTextField<TargetDraft>
              name='url'
              placeholder='https://example.com/api/'
              size='small'
              fullWidth
              slotProps={{ htmlInput: { 'aria-label': 'URL' } }}
            />
            <KintoneUrlButton onSelect={(url) => setValue('url', url, setOptions)} />
          </Box>

          <Box>
            <FieldTitle title='メソッド' />
            <FormToggleButtonGroup<TargetDraft>
              name='methods'
              label='メソッド'
              options={METHOD_OPTIONS}
            />
          </Box>

          <Box>
            <FieldTitle title='ヘッダー' tips={HEADER_TIPS} />
            <FormTextField<TargetDraft>
              name='headersText'
              multiline
              minRows={3}
              fullWidth
              spellCheck={false}
              placeholder={`{\n  "${API_TOKEN_HEADER}": "トークン"\n}`}
              slotProps={{ htmlInput: { 'aria-label': 'ヘッダー（JSON）' } }}
              sx={{ '& textarea': { fontFamily: 'monospace' } }}
            />
            <Button size='small' startIcon={<KeyIcon />} onClick={addToken}>
              kintone API トークンを追加
            </Button>
          </Box>

          <Box>
            <FieldTitle title='データ' tips={DATA_TIPS} />
            <FormTextField<TargetDraft>
              name='dataText'
              multiline
              minRows={3}
              fullWidth
              spellCheck={false}
              placeholder={'{\n  "channel": "C01234",\n  "limit": 100\n}'}
              slotProps={{ htmlInput: { 'aria-label': 'データ（JSON）' } }}
              sx={{ '& textarea': { fontFamily: 'monospace' } }}
            />
          </Box>
        </DialogContent>
      </FormProvider>
      <DialogActions>
        <Button onClick={onClose}>キャンセル</Button>
        <Button variant='contained' onClick={apply}>
          保存
        </Button>
      </DialogActions>
    </Dialog>
  );
};
