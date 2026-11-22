import { calculateAge } from './calculateAge';

type ResolveAgeValueParams = {
  /** 生年月日のフィールドの値（YYYY-MM-DD。未入力は空文字） */
  birthday: string;
  /** 年齢のフィールドの今の値 */
  currentAge: string;
  /** 年齢のフィールドの種類 */
  ageFieldType: 'SINGLE_LINE_TEXT' | 'NUMBER';
  /** 年齢の後に付ける単位（文字列（1行）のフィールドにだけ付ける） */
  unit: string;
  /** 年齢が入っていても計算し直すか */
  isUpdateOnSave: boolean;
};

/**
 * レコードの保存時に年齢のフィールドへ書き込む値を決める
 * @returns 書き込む値。書き込まないときは undefined
 */
export const resolveAgeValue = ({
  birthday,
  currentAge,
  ageFieldType,
  unit,
  isUpdateOnSave,
}: ResolveAgeValueParams): string | undefined => {
  if (currentAge !== '' && !isUpdateOnSave) return undefined;

  const age = calculateAge(birthday);
  // 誕生日が空・日付として読めない・未来の日付のときは、古い年齢を残さないよう空にする
  if (Number.isNaN(age) || age < 0) return '';

  return unit && ageFieldType === 'SINGLE_LINE_TEXT' ? `${age}${unit}` : String(age);
};
