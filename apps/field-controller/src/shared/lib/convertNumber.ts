/**
 * 文字列を数値に変換する。
 * kintone の NUMBER / CALC フィールドの value は文字列として渡される。
 *
 * @param value - 変換対象の値
 * @returns 変換後の数値。変換できない場合は null
 */
export function convertNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  return isNaN(n) ? null : n;
}
