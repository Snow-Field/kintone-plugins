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
import type { FormAutocompleteOption } from '@kintone-plugin/ui';
import {
  createDefaultRule,
  type DisableRule,
  type PluginConfig,
  type VisibilityRule,
} from '@/shared/config';
import { RuleCard } from './RuleCard';

type Props = {
  rulesPath: 'visibilityRules' | 'disableRules';
  triggerOptions: readonly FormAutocompleteOption[];
};

/** ドラッグ可能なルールアイテムのラッパー */
const SortableRuleItem: FC<{
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
 * ルール一覧コンポーネント（dnd-kit による並び替え対応）
 * useFieldArray はここだけで呼ぶ（二重呼び出しによる不整合を防ぐ）
 */
export const RuleList: FC<Props> = ({ rulesPath, triggerOptions }) => {
  const { control, getValues } = useFormContext<PluginConfig>();

  // useFieldArray はここだけで呼ぶ
  const { fields, append, insert, remove, move } = useFieldArray({
    control,
    name: rulesPath,
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
    const source = getValues(rulesPath)[index];
    if (!source) return;
    const duplicated = { ...structuredClone(source), id: nanoid() };
    // 非表示と編集不可のどちらの一覧かで型が分かれるが、React Hook Form は2種類の一覧を
    // まとめた型を受け取れない。複製元と同じ一覧に入れるので、形は必ず合う
    insert(index + 1, duplicated as VisibilityRule & DisableRule);
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
                onRemove={() => remove(index)}
                onDuplicate={() => handleDuplicate(index)}
                isRemoveDisabled={fields.length <= 1}
              />
            </SortableRuleItem>
          ))}
        </SortableContext>
      </DndContext>

      <Button
        variant='outlined'
        startIcon={<AddIcon />}
        onClick={() => append(createDefaultRule())}
        sx={{ borderStyle: 'dashed', width: '100%', py: 1.5 }}
      >
        ルールを追加
      </Button>
    </Box>
  );
};
