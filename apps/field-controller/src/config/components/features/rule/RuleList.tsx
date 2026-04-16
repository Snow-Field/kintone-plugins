import { type FC } from 'react';
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
import { type PluginConfig } from '@/shared/config';
import { useRuleActions } from '@/config/hooks/useRuleActions';
import { RuleCard } from './RuleCard';

type TriggerOption = {
  label: string;
  value: string;
};

type Props = {
  rulesPath: 'visibilityRules' | 'disableRules';
  triggerOptions: TriggerOption[];
};

/** ドラッグ可能なルールアイテムのラッパー */
const SortableRuleItem: FC<{
  id: string;
  children: React.ReactNode;
}> = ({ id, children }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  });

  // CSS.Transform.toString の代替実装（@dnd-kit/utilities 不要）
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
 * ルール一覧コンポーネント（dnd-kit による並び替え対応）
 */
export const RuleList: FC<Props> = ({ rulesPath, triggerOptions }) => {
  const { control } = useFormContext<PluginConfig>();
  const { fields } = useFieldArray({ control, name: rulesPath });
  const { appendRule, removeRule, moveRule, duplicateRule } = useRuleActions(rulesPath);

  const sensors = useSensors(useSensor(PointerSensor));

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const fromIndex = fields.findIndex((f) => f.id === active.id);
      const toIndex = fields.findIndex((f) => f.id === over.id);
      if (fromIndex !== -1 && toIndex !== -1) {
        moveRule(fromIndex, toIndex);
      }
    }
  };

  return (
    <Box>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={fields.map((f) => f.id)} strategy={verticalListSortingStrategy}>
          {fields.map((field, index) => (
            <SortableRuleItem key={field.id} id={field.id}>
              <RuleCard
                rulesPath={rulesPath}
                ruleIndex={index}
                triggerOptions={triggerOptions}
                onRemove={() => removeRule(index)}
                onDuplicate={() => duplicateRule(index)}
                isRemoveDisabled={fields.length <= 1}
              />
            </SortableRuleItem>
          ))}
        </SortableContext>
      </DndContext>

      <Button
        variant='outlined'
        startIcon={<AddIcon />}
        onClick={appendRule}
        sx={{ borderStyle: 'dashed', width: '100%', py: 1.5 }}
      >
        ルールを追加
      </Button>
    </Box>
  );
};
