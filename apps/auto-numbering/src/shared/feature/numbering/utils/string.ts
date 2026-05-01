/**
 * ゼロ埋め
 */
export function padZero(value: number, digit: number): string {
  return String(value).padStart(digit, '0');
}
