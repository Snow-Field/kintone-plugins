import type { ReactNode } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Button } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { SortableRowContainer } from "./SortableRowContainer";

type Props<T extends { id: string }> = {
  items: T[];
  onMove: (from: number, to: number) => void;
  onAdd: (index?: number) => void;
  onRemove: (index: number) => void;
  renderItem: (item: T, index: number) => ReactNode;
  addButtonLabel?: string;
};

export function DynamicSortableList<T extends { id: string }>({
  items,
  onMove,
  onAdd,
  onRemove,
  renderItem,
  addButtonLabel = "追加",
}: Props<T>) {
  const sensors = useSensors(useSensor(PointerSensor));

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      onMove(
        items.findIndex((i) => i.id === active.id),
        items.findIndex((i) => i.id === over.id),
      );
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={items.map((i) => i.id)}
        strategy={verticalListSortingStrategy}
      >
        {items.map((item, index) => (
          <SortableRowContainer
            key={item.id}
            id={item.id}
            index={index}
            onAdd={onAdd}
            onDelete={onRemove}
            isDeleteDisabled={items.length <= 1}
          >
            {renderItem(item, index)}
          </SortableRowContainer>
        ))}
      </SortableContext>
      <Button
        variant="outlined"
        startIcon={<AddIcon />}
        onClick={() => onAdd()}
        sx={{
          mt: 1,
          py: 1,
          borderStyle: "dashed",
          width: "100%",
          justifyContent: "center",
        }}
      >
        {addButtonLabel}
      </Button>
    </DndContext>
  );
}
