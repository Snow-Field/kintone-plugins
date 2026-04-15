/**
 * 文字列を Date に変換する。
 * kintone のフィールド値の形式に対応する。
 *
 * | フィールドタイプ | 形式例                    |
 * |----------------|--------------------------|
 * | DATE           | "YYYY-MM-DD"             |
 * | TIME           | "HH:mm"                  |
 * | DATETIME       | "YYYY-MM-DDTHH:mm:ssZ"   |
 *
 * @param value - 変換対象の値
 * @returns 変換後の Date。変換できない場合は null
 */
export function convertDate(value: unknown): Date | null {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value !== 'string') return null;

  // 時刻のみ（HH:mm）は比較用に固定日付を付与して Date 化
  const timeRegex = /^\d{2}:\d{2}$/;
  if (timeRegex.test(value)) {
    const d = new Date(`1970-01-01T${value}:00`);
    return isNaN(d.getTime()) ? null : d;
  }

  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
}
