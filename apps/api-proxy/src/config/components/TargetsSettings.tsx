import { type FC, useState } from 'react';
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
import { overlappingTargets } from '@/shared/lib/targets';
import { TitleWithTip } from './InfoTip';
import { TargetDialog } from './TargetDialog';
import { TargetRow } from './TargetRow';

const createTarget = (): Target => ({
  id: nanoid(),
  url: '',
  methods: [...PROXY_METHODS],
  headers: [],
  data: [],
  memo: '',
  enabled: true,
});

const ABOUT_TIPS = [
  'ヘッダーとデータは、利用者には見えない場所（プロキシ設定）に保存します',
  'kintone.plugin.app.proxy を呼ぶと、kintone のサーバーが値を付けて送ります',
  '保存したあと「アプリを更新」で反映します',
];

const URL_TIPS = ['この URL で始まるリクエストに、ヘッダーとデータが付きます'];

const ENABLED_TIPS = [
  '無効にすると、この接続先の値は付かなくなります',
  'ただし、URL が前方一致で重なる、有効なほかの接続先の値は付きます',
  '値は消さずに残すので、有効に戻せばそのまま使えます',
];

const HEADER_TIPS = [
  'キーだけを出しています。値は「編集」の中でだけ見えます',
  'キーは利用者からも見えます',
];

/** 表の見出し（ⓘ 付き） */
const HeadCell: FC<{ title: string; tips?: string[] }> = ({ title, tips }) => (
  <TableCell sx={{ fontWeight: 600, whiteSpace: 'nowrap' }}>
    {tips ? <TitleWithTip title={title} label={`${title}の説明`} lines={tips} /> : title}
  </TableCell>
);

/** 接続先タブ */
export const TargetsSettings: FC = () => {
  const { control } = useFormContext<PluginConfig>();
  const { fields, insert, move, remove, update } = useFieldArray({
    control,
    name: 'targets',
    keyName: 'fieldKey',
  });
  const targets = useWatch({ control, name: 'targets' }) ?? [];
  const overlaps = overlappingTargets(targets);
  /** 編集ダイアログで開いている接続先と位置（追加なら、入る位置） */
  const [editing, setEditing] = useState<{ target: Target; index: number; isNew: boolean } | null>(
    null
  );
  const others = editing ? targets.filter((_, i) => editing.isNew || i !== editing.index) : [];

  const openNew = (index: number) => setEditing({ target: createTarget(), index, isNew: true });
  const applyEditing = (target: Target) => {
    if (!editing) return;
    if (editing.isNew) insert(editing.index, target);
    else update(editing.index, target);
    setEditing(null);
  };
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
                <HeadCell title='有効' tips={ENABLED_TIPS} />
                <HeadCell title='URL' tips={URL_TIPS} />
                <HeadCell title='メソッド' />
                <HeadCell title='ヘッダー' tips={HEADER_TIPS} />
                <HeadCell title='説明' />
                <TableCell sx={{ width: 136 }} />
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
                      onEdit={() =>
                        setEditing({ target: targets[i] ?? createTarget(), index: i, isNew: false })
                      }
                      onInsertAfter={() => openNew(i + 1)}
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
        onClick={() => openNew(fields.length)}
        sx={{ mt: fields.length > 0 ? 2 : 0, py: 1, width: '100%', borderStyle: 'dashed' }}
      >
        接続先を追加
      </Button>
      {editing && (
        <TargetDialog
          // 開くたびに作り直す（前に開いた接続先の値を残さないため）
          key={`${editing.isNew ? 'new' : 'edit'}-${editing.index}-${editing.target.id}`}
          editing={editing}
          others={others}
          onApply={applyEditing}
          onClose={() => setEditing(null)}
        />
      )}
    </FormSection>
  );
};
