import type { FC } from 'react';
import { useFieldArray, useFormContext, useWatch } from 'react-hook-form';
import { nanoid } from 'nanoid';
import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  Alert,
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { FormSection, Text } from '@kintone-plugin/ui';
import { type PluginConfig, PROXY_METHODS, type Target } from '@/shared/config';
import { API_TOKEN_HEADER, MAX_API_TOKENS, overlappingTargets } from '@/shared/lib/targets';
import { InfoTip, TitleWithTip } from './InfoTip';
import { TargetRow } from './TargetRow';

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
  'kintone.plugin.app.proxy を呼ぶと、kintone のサーバーが値を付けて送ります',
  '保存したあと「アプリを更新」で反映します',
];

const URL_TIPS = [
  'この URL で始まるリクエストに値が付きます（例：…/k/v1/ を登録すると …/k/v1/records.json にも付く）',
  '絞りたいときは、パスまで具体的に書きます（例：…/k/v1/records.json）',
  'URL とメモは利用者からも見えるので、秘密を書かないでください',
];

const METHOD_TIPS = ['選んだメソッドのリクエストにだけ値が付きます'];

const HEADER_TIPS = [
  'API トークンなど、リクエストのヘッダーに付ける値です',
  `kintone のトークンはキー ${API_TOKEN_HEADER} に書きます`,
  `複数のアプリ（ルックアップ元を含む）は、カンマ区切りで${MAX_API_TOKENS}個まで書けます`,
  'キーは利用者からも見えます。値だけが伏せられます',
];

const DATA_TIPS = [
  '固定したい値や、毎回送る値を書きます（任意）',
  'GET・DELETE：URL のクエリ文字列に足されます（呼び出し側の同じキーは消えないので、固定はできません）',
  'POST・PUT：呼び出し側の本文がオブジェクトのときに足され、同じキーは保存した値が優先されます',
  '本文を文字列（JSON.stringify など）で渡すと足されません',
];

/** 表の見出し（ⓘ 付き） */
const HeadCell: FC<{ title: string; tips?: string[] }> = ({ title, tips }) => (
  <TableCell sx={{ fontWeight: 600, whiteSpace: 'nowrap' }}>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
      {title}
      {tips && <InfoTip label={`${title}の説明`} lines={tips} />}
    </Box>
  </TableCell>
);

/** 接続先タブ */
export const TargetsSettings: FC = () => {
  const { control } = useFormContext<PluginConfig>();
  const { fields, append, insert, move, remove } = useFieldArray({
    control,
    name: 'targets',
    keyName: 'fieldKey',
  });
  const targets = useWatch({ control, name: 'targets' }) ?? [];
  const overlaps = overlappingTargets(targets);
  // キーボードでも並べ替えられるようにする（取っ手にフォーカスして Space → 矢印キー）
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const from = fields.findIndex((f) => f.fieldKey === active.id);
    const to = fields.findIndex((f) => f.fieldKey === over.id);
    if (from !== -1 && to !== -1) move(from, to);
  };

  return (
    <FormSection>
      <Text variant='sectionTitle'>
        <TitleWithTip title='接続先' label='接続先の説明' lines={ABOUT_TIPS} />
      </Text>

      {overlaps.map(([a, b]) => (
        <Alert key={`${a}-${b}`} severity='info' sx={{ mb: 2 }}>
          {`接続先 ${a + 1} と ${b + 1} は URL が重なっています（長く一致した方の値が優先されます）`}
        </Alert>
      ))}

      {fields.length > 0 && (
        // 画面が狭いときは、表を横にスクロールする
        <TableContainer sx={{ overflowX: 'auto' }}>
          <Table size='small'>
            <TableHead>
              <TableRow>
                <TableCell sx={{ width: 64 }} />
                <HeadCell title='URL' tips={URL_TIPS} />
                <HeadCell title='メソッド' tips={METHOD_TIPS} />
                <HeadCell title='ヘッダー' tips={HEADER_TIPS} />
                <HeadCell title='本文の値' tips={DATA_TIPS} />
                <HeadCell title='メモ' />
                <TableCell />
              </TableRow>
            </TableHead>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={fields.map((f) => f.fieldKey)}
                strategy={verticalListSortingStrategy}
              >
                <TableBody>
                  {fields.map((field, i) => (
                    <TargetRow
                      key={field.fieldKey}
                      sortableId={field.fieldKey}
                      index={i}
                      onInsertAfter={() => insert(i + 1, createTarget())}
                      onRemove={() => remove(i)}
                    />
                  ))}
                </TableBody>
              </SortableContext>
            </DndContext>
          </Table>
        </TableContainer>
      )}
      <Button
        variant='outlined'
        startIcon={<AddIcon />}
        onClick={() => append(createTarget())}
        sx={{ mt: fields.length > 0 ? 2 : 0, py: 1, width: '100%', borderStyle: 'dashed' }}
      >
        接続先を追加
      </Button>
    </FormSection>
  );
};
