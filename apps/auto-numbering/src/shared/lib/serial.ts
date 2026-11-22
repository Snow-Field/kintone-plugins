import type { SerialContext } from '@/shared/types/numbering';

/**
 * レコードから連番を抽出する
 */
export function extractSerialWithResets(
  ctx: Pick<SerialContext, 'resultFieldCode' | 'serialConfig' | 'connector'>,
  records: Array<Record<string, { type: string; value: unknown }>>
): number {
  const { resultFieldCode, serialConfig, connector } = ctx;
  const { position } = serialConfig;

  // 連番の開始位置
  const isPrefix = position === 'prefix';

  // リセットあり → resultFieldCodeの値を分割して最大連番を探す
  let maxSerial = 0;
  for (const record of records) {
    const fieldValue = record[resultFieldCode]?.value;
    const fullValue = typeof fieldValue === 'string' ? fieldValue : String(fieldValue ?? '');
    const segments = fullValue.split(connector);
    // positionに応じて先頭or末尾から連番セグメントを特定
    const serialSegment = isPrefix ? segments[0] : segments[segments.length - 1];
    const serialNum = Number(serialSegment);
    // 数値変換できないレコードはスキップ（手入力による異常値の可能性）
    if (Number.isNaN(serialNum)) continue;
    if (serialNum > maxSerial) {
      maxSerial = serialNum;
    }
  }

  return maxSerial;
}
