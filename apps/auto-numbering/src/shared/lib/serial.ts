import type { SerialContext } from '@/shared/types/numbering';

type SerialFormat = Pick<SerialContext, 'serialConfig' | 'connector' | 'formatString'>;

/**
 * 採番値が、この書式（連番を除く部分）で作られたものか
 * 連番が末尾なら「書式-連番」、先頭なら「連番-書式」の形で、連番の部分が数字だけのもの
 */
export function matchesFormat(
  { serialConfig, connector, formatString }: SerialFormat,
  value: string
): boolean {
  const isPrefix = serialConfig.position === 'prefix';
  const affix = isPrefix ? `${connector}${formatString}` : `${formatString}${connector}`;
  if (isPrefix ? !value.endsWith(affix) : !value.startsWith(affix)) return false;
  const serial = isPrefix ? value.slice(0, -affix.length) : value.slice(affix.length);
  return /^\d+$/.test(serial);
}

/**
 * 同じ書式の採番値から、最大の連番を返す
 * 連番の部分が数字でないもの（手入力による異常値の可能性）は飛ばす
 */
export function extractMaxSerial(
  { serialConfig, connector }: Pick<SerialContext, 'serialConfig' | 'connector'>,
  values: string[]
): number {
  const isPrefix = serialConfig.position === 'prefix';
  let maxSerial = 0;
  for (const value of values) {
    const segments = value.split(connector);
    const serial = Number(isPrefix ? segments[0] : segments[segments.length - 1]);
    if (!Number.isNaN(serial) && serial > maxSerial) maxSerial = serial;
  }
  return maxSerial;
}
