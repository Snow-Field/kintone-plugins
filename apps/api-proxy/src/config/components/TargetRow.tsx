import type { FC } from 'react';
import { useFormContext, useFormState, useWatch } from 'react-hook-form';
import { useSortable } from '@dnd-kit/sortable';
import { Box, Chip, IconButton, TableCell, TableRow, Tooltip, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import EditIcon from '@mui/icons-material/Edit';
import type { PluginConfig } from '@/shared/config';

type Props = {
  /** 並べ替えの識別子（useFieldArray の行の key） */
  sortableId: string;
  index: number;
  onEdit: () => void;
  /** この行の後ろに接続先を足す */
  onInsertAfter: () => void;
  onRemove: () => void;
};

/** 値が無いときの表示 */
const Empty: FC = () => (
  <Typography component='span' variant='body2' sx={{ color: 'text.secondary' }}>
    —
  </Typography>
);

/** 接続先1件の一覧の行（読み取り専用。編集はダイアログで行う） */
export const TargetRow: FC<Props> = ({ sortableId, index, onEdit, onInsertAfter, onRemove }) => {
  const { control } = useFormContext<PluginConfig>();
  const target = useWatch({ control, name: `targets.${index}` });
  const { errors } = useFormState({ control, name: `targets.${index}` });
  const hasError = errors.targets?.[index] !== undefined;
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: sortableId,
  });
  if (!target) return null;

  const headerKeys = target.headers.map((h) => h.key).join(', ');
  const dataKeys = target.data.map((d) => d.key).join(', ');

  return (
    <TableRow
      ref={setNodeRef}
      // 並べ替えの動きは dnd-kit が毎フレーム計算するので、sx ではなく style で渡す
      style={{
        transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
        transition,
      }}
      sx={{
        position: 'relative',
        zIndex: isDragging ? 1 : 'auto',
        bgcolor: isDragging ? 'action.hover' : undefined,
        '& > td': { py: 1 },
      }}
    >
      <TableCell sx={{ px: 0.5, whiteSpace: 'nowrap', color: 'text.secondary' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Tooltip title='ドラッグして並べ替え'>
            <IconButton
              {...attributes}
              {...listeners}
              size='small'
              aria-label={`接続先 ${index + 1} を並べ替え`}
              sx={{ cursor: 'grab', color: 'text.disabled' }}
            >
              <DragIndicatorIcon fontSize='small' />
            </IconButton>
          </Tooltip>
          {index + 1}
        </Box>
      </TableCell>
      <TableCell>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {target.memo ? target.memo : <Empty />}
          {hasError && (
            <Tooltip title='「編集」を開くと、誤りの理由が出ます'>
              <Chip label='要修正' color='error' size='small' variant='outlined' />
            </Tooltip>
          )}
        </Box>
      </TableCell>
      <TableCell sx={{ wordBreak: 'break-all' }}>{target.url || <Empty />}</TableCell>
      <TableCell sx={{ whiteSpace: 'nowrap' }}>
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          {target.methods.length === 0 ? (
            <Empty />
          ) : (
            target.methods.map((m) => <Chip key={m} label={m} size='small' />)
          )}
        </Box>
      </TableCell>
      <TableCell>{headerKeys || <Empty />}</TableCell>
      <TableCell>{dataKeys || <Empty />}</TableCell>
      <TableCell sx={{ px: 0.5, whiteSpace: 'nowrap' }}>
        <Tooltip title='編集'>
          <IconButton aria-label={`接続先 ${index + 1} を編集`} onClick={onEdit}>
            <EditIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title='この下に追加'>
          <IconButton aria-label={`接続先 ${index + 1} の下に追加`} onClick={onInsertAfter}>
            <AddIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title='削除'>
          <IconButton aria-label={`接続先 ${index + 1} を削除`} onClick={onRemove}>
            <DeleteIcon />
          </IconButton>
        </Tooltip>
      </TableCell>
    </TableRow>
  );
};
