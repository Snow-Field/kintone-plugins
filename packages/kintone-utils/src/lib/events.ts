import type { RecordEvent, RecordEventType } from '../types/events';

type RecordEventHandler<T extends RecordEventType> = (
  event: RecordEvent<T>
) => RecordEvent<T> | Promise<RecordEvent<T>>;

/**
 * レコード画面のイベントを型付きで登録する
 * 公式の型（`kintone.events.on`）ではハンドラの引数が `any` になるため、この関数を経由する
 */
export const onRecordEvents = <T extends RecordEventType>(
  types: readonly T[],
  handler: RecordEventHandler<T>
): void => {
  kintone.events.on([...types], handler);
};
