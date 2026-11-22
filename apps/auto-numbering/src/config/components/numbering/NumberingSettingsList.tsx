import type { FC, ReactNode } from 'react';
import { useFormContext, useFieldArray } from 'react-hook-form';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { Box, Button, IconButton, Tooltip } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import { nanoid } from 'nanoid';
import { createDefaultNumberingSetting, type PluginConfig } from '@/shared/config';
import { NumberingSettingCard } from './NumberingSettingCard';

/** ドラッグ可能な設定アイテムのラッパー */
const SortableSettingItem: FC<{
  id: string;
  children: ReactNode;
}> = ({ id, children }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  });

  const transformStr = transform
    ? `translate3d(${transform.x}px, ${transform.y}px, 0) scaleX(${transform.scaleX}) scaleY(${transform.scaleY})`
    : undefined;

  return (
    <Box
      ref={setNodeRef}
      style={{
        transform: transformStr,
        transition,
        zIndex: isDragging ? 10 : 1,
        opacity: isDragging ? 0.6 : 1,
      }}
      sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 2 }}
    >
      <Tooltip title='ドラッグして並び替え'>
        <IconButton
          {...attributes}
          {...listeners}
          size='small'
          sx={{ cursor: 'grab', color: 'text.disabled', mt: 1 }}
        >
          <DragIndicatorIcon />
        </IconButton>
      </Tooltip>
      <Box sx={{ flex: 1, minWidth: 0 }}>{children}</Box>
    </Box>
  );
};

/**
 * 採番設定一覧コンポーネント（dnd-kit による並び替え対応）
 * useFieldArray はここだけで呼ぶ（二重呼び出しによる不整合を防ぐ）
 */
export const NumberingSettingsList: FC = () => {
  const { control, getValues } = useFormContext<PluginConfig>();

  // useFieldArray はここだけで呼ぶ
  const { fields, append, insert, remove, move } = useFieldArray({
    control,
    name: 'numberingSettings',
  });

  const sensors = useSensors(useSensor(PointerSensor));

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const fromIndex = fields.findIndex((f) => f.id === active.id);
      const toIndex = fields.findIndex((f) => f.id === over.id);
      if (fromIndex !== -1 && toIndex !== -1) {
        move(fromIndex, toIndex);
      }
    }
  };

  const handleDuplicate = (index: number) => {
    const settings = getValues('numberingSettings');
    const source = settings[index];
    if (!source) return;
    insert(index + 1, {
      ...structuredClone(source),
      id: nanoid(),
      label: source.label ? `${source.label} (コピー)` : '',
    });
  };

  return (
    <Box>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={fields.map((f) => f.id)} strategy={verticalListSortingStrategy}>
          {fields.map((field, index) => (
            <SortableSettingItem key={field.id} id={field.id}>
              <NumberingSettingCard
                settingIndex={index}
                onRemove={() => remove(index)}
                onDuplicate={() => handleDuplicate(index)}
                isRemoveDisabled={fields.length <= 1}
              />
            </SortableSettingItem>
          ))}
        </SortableContext>
      </DndContext>

      <Button
        variant='outlined'
        startIcon={<AddIcon />}
        onClick={() => append(createDefaultNumberingSetting())}
        disabled={fields.length >= 5}
        sx={{ borderStyle: 'dashed', width: '100%', py: 1.5 }}
      >
        採番設定を追加 ({fields.length}/5)
      </Button>
    </Box>
  );
};
