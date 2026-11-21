const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

/**
 * kintone の日付フィールドの値（YYYY-MM-DD）から、今日時点の満年齢を求める。
 *
 * 日付フィールドの値は暦日なので、Date に変換せず年月日の数値として比較する。
 * `new Date('YYYY-MM-DD')` は UTC の 0 時として解釈されるため、ローカル時刻の
 * 年月日と比べると UTC より西のタイムゾーンで誕生日が1日ずれる。
 *
 * @returns 満年齢。YYYY-MM-DD 形式でない値（未入力を含む）は NaN
 */
export function calculateAge(dateString: string): number {
  const match = DATE_PATTERN.exec(dateString);
  if (!match) return Number.NaN;

  const birthYear = Number(match[1]);
  const birthMonth = Number(match[2]);
  const birthDay = Number(match[3]);

  const today = new Date();
  const todayMonth = today.getMonth() + 1;
  let age = today.getFullYear() - birthYear;

  // 今年の誕生日をまだ迎えていなければ1つ引く
  if (todayMonth < birthMonth || (todayMonth === birthMonth && today.getDate() < birthDay)) {
    age--;
  }

  return age;
}
