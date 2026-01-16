import type { FC, ReactNode } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Box, IconButton, Tooltip } from '@mui/material';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';

type Props = {
  id: string;
  index: number;
  onAdd: (index: number) => void;
  onDelete: (index: number) => void;
  isDeleteDisabled?: boolean;
  children: ReactNode;
};

export const SortableRowContainer: FC<Props> = ({
  id,
  index,
  onAdd,
  onDelete,
  isDeleteDisabled,
  children,
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    opacity: isDragging ? 0.6 : 1,
  };

  return (
    <Box
      ref={setNodeRef}
      style={style}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        p: 1,
        mb: 1,
        bgcolor: 'background.paper',
        borderRadius: 1,
        border: '1px solid',
        borderColor: isDragging ? 'primary.main' : 'transparent',
        boxShadow: isDragging ? 3 : 'none',
        '&:hover': { borderColor: 'divider', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' },
      }}
    >
      <Box
        {...attributes}
        {...listeners}
        sx={{
          cursor: 'grab',
          color: 'text.disabled',
          px: 0.5,
          mt: '9px',
        }}
      >
        <DragIndicatorIcon fontSize="small" />
      </Box>

      <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', minWidth: 0 }}>{children}</Box>

      <Box sx={{ display: 'flex', mt: '4px' }}>
        <Tooltip title="下に新しい行を追加">
          <IconButton size="small" onClick={() => onAdd(index + 1)}>
            <AddIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="この行を削除">
          <IconButton
            size="small"
            onClick={() => onDelete(index)}
            disabled={isDeleteDisabled}
            color="error"
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );
};
