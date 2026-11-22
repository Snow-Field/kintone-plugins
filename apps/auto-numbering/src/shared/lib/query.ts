/**
 * kintone の検索条件（クエリ）に入れる値を、ダブルクォートで囲んで返す
 * 値の中の " と \ はエスケープする。そのまま入れると検索条件が壊れ、採番に失敗する
 */
export const quoteQueryValue = (value: string): string =>
  `"${value.replaceAll('\\', '\\\\').replaceAll('"', '\\"')}"`;
