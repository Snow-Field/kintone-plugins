import { OPERATOR_TYPES, type RuleBlock } from '../config/staticSchema';
import { convertDate } from './convertDate';
import { convertNumber } from './convertNumber';

/**
 * kintone イベントのレコードフィールド値の型。
 * オプショナルプロパティは、一部のイベントでのみ存在する。
 */
export type KintoneEventField = {
  type?: string;
  value: string | string[] | null | undefined;
  disabled?: boolean;
  error?: string | null;
};

/** kintone イベントのレコード型 */
export type KintoneEventRecord = Record<string, KintoneEventField>;

/** kintone イベントオブジェクトの型 */
export type KintoneEvent = {
  type: string;
  record: KintoneEventRecord;
};

// =============================================================================
// 内部ユーティリティ
// =============================================================================

/**
 * フィールド値を単一文字列として取得する。
 * 配列の場合は最初の要素を返す（単一値比較用）。
 */
function toStringValue(value: KintoneEventField['value']): string {
  if (Array.isArray(value)) return value[0] ?? '';
  return value ?? '';
}

/**
 * 条件値を単一文字列として取得する。
 */
function toConditionString(conditionValue: string | string[]): string {
  return typeof conditionValue === 'string' ? conditionValue : (conditionValue[0] ?? '');
}

// =============================================================================
// 演算子別評価関数
// =============================================================================

function evaluateEquals(
  fieldValue: KintoneEventField['value'],
  conditionValue: string | string[]
): boolean {
  const fv = toStringValue(fieldValue);
  const cv = toConditionString(conditionValue);

  // 数値として比較できる場合は数値比較
  const fNum = convertNumber(fv);
  const cNum = convertNumber(cv);
  if (fNum !== null && cNum !== null) return fNum === cNum;

  // 日付として比較できる場合は日付比較
  const fDate = convertDate(fv);
  const cDate = convertDate(cv);
  if (fDate !== null && cDate !== null) return fDate.getTime() === cDate.getTime();

  return fv === cv;
}

function evaluateNotEquals(
  fieldValue: KintoneEventField['value'],
  conditionValue: string | string[]
): boolean {
  const fv = toStringValue(fieldValue);
  const cv = toConditionString(conditionValue);

  const fNum = convertNumber(fv);
  const cNum = convertNumber(cv);
  if (fNum !== null && cNum !== null) return fNum !== cNum;

  const fDate = convertDate(fv);
  const cDate = convertDate(cv);
  if (fDate !== null && cDate !== null) return fDate.getTime() !== cDate.getTime();

  return fv !== cv;
}

function evaluateGreaterThan(
  fieldValue: KintoneEventField['value'],
  conditionValue: string | string[]
): boolean {
  const fv = toStringValue(fieldValue);
  const cv = toConditionString(conditionValue);

  const fNum = convertNumber(fv);
  const cNum = convertNumber(cv);
  if (fNum !== null && cNum !== null) return fNum > cNum;

  const fDate = convertDate(fv);
  const cDate = convertDate(cv);
  if (fDate !== null && cDate !== null) return fDate.getTime() > cDate.getTime();

  return false;
}

function evaluateLessThan(
  fieldValue: KintoneEventField['value'],
  conditionValue: string | string[]
): boolean {
  const fv = toStringValue(fieldValue);
  const cv = toConditionString(conditionValue);

  const fNum = convertNumber(fv);
  const cNum = convertNumber(cv);
  if (fNum !== null && cNum !== null) return fNum < cNum;

  const fDate = convertDate(fv);
  const cDate = convertDate(cv);
  if (fDate !== null && cDate !== null) return fDate.getTime() < cDate.getTime();

  return false;
}

function evaluateGreaterThanOrEqual(
  fieldValue: KintoneEventField['value'],
  conditionValue: string | string[]
): boolean {
  const fv = toStringValue(fieldValue);
  const cv = toConditionString(conditionValue);

  const fNum = convertNumber(fv);
  const cNum = convertNumber(cv);
  if (fNum !== null && cNum !== null) return fNum >= cNum;

  const fDate = convertDate(fv);
  const cDate = convertDate(cv);
  if (fDate !== null && cDate !== null) return fDate.getTime() >= cDate.getTime();

  return false;
}

function evaluateLessThanOrEqual(
  fieldValue: KintoneEventField['value'],
  conditionValue: string | string[]
): boolean {
  const fv = toStringValue(fieldValue);
  const cv = toConditionString(conditionValue);

  const fNum = convertNumber(fv);
  const cNum = convertNumber(cv);
  if (fNum !== null && cNum !== null) return fNum <= cNum;

  const fDate = convertDate(fv);
  const cDate = convertDate(cv);
  if (fDate !== null && cDate !== null) return fDate.getTime() <= cDate.getTime();

  return false;
}

/**
 * includes 評価。
 *
 * フィールド値の型によって評価方法を切り替える。
 * - 配列フィールド（CHECK_BOX, MULTI_SELECT 等）:
 *   conditionValue の全要素がフィールド値の配列に含まれるか
 * - 文字列フィールド（SINGLE_LINE_TEXT, MULTI_LINE_TEXT, RADIO_BUTTON, DROP_DOWN 等）:
 *   フィールド値が conditionValue を部分文字列として含むか
 */
function evaluateIncludes(
  fieldValue: KintoneEventField['value'],
  conditionValue: string | string[]
): boolean {
  if (Array.isArray(fieldValue)) {
    // 配列フィールド: conditionValue の全要素が含まれるか
    const cvArray = Array.isArray(conditionValue) ? conditionValue : [conditionValue];
    return cvArray.every((cv) => fieldValue.includes(cv));
  }
  // 文字列フィールド: 部分一致
  const fv = fieldValue ?? '';
  const cv = toConditionString(conditionValue);
  return fv.includes(cv);
}

/**
 * notIncludes 評価。
 *
 * フィールド値の型によって評価方法を切り替える。
 *
 * - 配列フィールド（CHECK_BOX, MULTI_SELECT 等）:
 *   conditionValue の要素が1つも含まれていないか
 * - 文字列フィールド（SINGLE_LINE_TEXT, MULTI_LINE_TEXT, RADIO_BUTTON, DROP_DOWN 等）:
 *   フィールド値が conditionValue を部分文字列として含まないか
 */
function evaluateNotIncludes(
  fieldValue: KintoneEventField['value'],
  conditionValue: string | string[]
): boolean {
  if (Array.isArray(fieldValue)) {
    // 配列フィールド: conditionValue の要素が1つも含まれていないか
    const cvArray = Array.isArray(conditionValue) ? conditionValue : [conditionValue];
    return cvArray.every((cv) => !fieldValue.includes(cv));
  }
  // 文字列フィールド: 部分一致しない
  const fv = fieldValue ?? '';
  const cv = toConditionString(conditionValue);
  return !fv.includes(cv);
}

// =============================================================================
// 演算子評価ディスパッチャ
// =============================================================================

const OPERATOR_EVALUATORS: Record<
  OPERATOR_TYPES,
  (fieldValue: KintoneEventField['value'], conditionValue: string | string[]) => boolean
> = {
  [OPERATOR_TYPES.EQUALS]: evaluateEquals,
  [OPERATOR_TYPES.NOT_EQUALS]: evaluateNotEquals,
  [OPERATOR_TYPES.GREATER_THAN]: evaluateGreaterThan,
  [OPERATOR_TYPES.LESS_THAN]: evaluateLessThan,
  [OPERATOR_TYPES.GREATER_THAN_OR_EQUAL]: evaluateGreaterThanOrEqual,
  [OPERATOR_TYPES.LESS_THAN_OR_EQUAL]: evaluateLessThanOrEqual,
  [OPERATOR_TYPES.INCLUDES]: evaluateIncludes,
  [OPERATOR_TYPES.NOT_INCLUDES]: evaluateNotIncludes,
};

/**
 * 1条件を評価する
 */
function evaluateCondition(
  condition: RuleBlock['conditions'][number],
  record: KintoneEventRecord
): boolean {
  const fieldValue = record[condition.field]?.value;
  const evaluator = OPERATOR_EVALUATORS[condition.operator];
  return evaluator ? evaluator(fieldValue, condition.value) : false;
}

// =============================================================================
// ブロック評価
// =============================================================================

/**
 * ルールブロックを評価し、フィールド制御を適用すべきかどうかを返す。
 *
 * @param block  - ルールブロック（トリガー・条件・ロジックを含む）
 * @param event  - kintone イベントオブジェクト
 * @returns トリガーが一致し、かつ条件が満たされた場合に true
 */
export function evaluateBlock(block: RuleBlock, event: KintoneEvent): boolean {
  // トリガーが未設定の場合は評価しない
  if (block.triggers.length === 0) return false;

  // イベントタイプがトリガーに含まれない場合はスキップ
  if (!block.triggers.includes(event.type as never)) {
    return false;
  }

  // 条件が空の場合は無条件で適用
  if (block.conditions.length === 0) {
    return true;
  }

  const results = block.conditions.map((condition) => evaluateCondition(condition, event.record));

  return block.logic === 'AND' ? results.every(Boolean) : results.some(Boolean);
}
