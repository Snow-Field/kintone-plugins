import { describe, expect, it } from 'vitest';
import { type DisableRuleBlock, OPERATOR_TYPES } from '../config/staticSchema';
import { evaluateBlock, type KintoneEvent } from './ruleEvaluator';

const TRIGGER = 'app.record.edit.show';

const event = (record: KintoneEvent['record'], type = TRIGGER): KintoneEvent => ({ type, record });

const block = (
  conditions: DisableRuleBlock['conditions'],
  logic: DisableRuleBlock['logic'] = 'AND',
  triggers: DisableRuleBlock['triggers'] = [TRIGGER]
): DisableRuleBlock => ({ conditions, logic, triggers });

/** 1つの条件だけを評価する */
const evaluate = (
  operator: OPERATOR_TYPES,
  fieldValue: unknown,
  value: string | string[]
): boolean =>
  evaluateBlock(block([{ field: 'f', operator, value }]), event({ f: { value: fieldValue } }));

describe('evaluateBlock: トリガーと条件の組み立て', () => {
  it('トリガーが空なら、条件に関係なく適用しない', () => {
    expect(evaluateBlock(block([], 'AND', []), event({}))).toBe(false);
  });

  it('イベントがトリガーに含まれなければ適用しない', () => {
    expect(evaluateBlock(block([]), event({}, 'app.record.create.show'))).toBe(false);
  });

  it('条件が空なら、トリガーが合えば必ず適用する', () => {
    expect(evaluateBlock(block([]), event({}))).toBe(true);
  });

  it('AND はすべての条件、OR はどれかの条件が合えば適用する', () => {
    const conditions = [
      { field: 'a', operator: OPERATOR_TYPES.EQUALS, value: '1' },
      { field: 'b', operator: OPERATOR_TYPES.EQUALS, value: '1' },
    ];
    const record = { a: { value: '1' }, b: { value: '2' } };
    expect(evaluateBlock(block(conditions, 'AND'), event(record))).toBe(false);
    expect(evaluateBlock(block(conditions, 'OR'), event(record))).toBe(true);
  });

  it('レコードに無いフィールドの条件は、空の値として評価する', () => {
    const conditions = [{ field: 'missing', operator: OPERATOR_TYPES.EQUALS, value: '' }];
    expect(evaluateBlock(block(conditions), event({}))).toBe(true);
  });
});

describe('evaluateBlock: 演算子', () => {
  it.each([
    [OPERATOR_TYPES.EQUALS, '10', '10.0', true],
    [OPERATOR_TYPES.EQUALS, 'abc', 'abc', true],
    [OPERATOR_TYPES.EQUALS, '2026-01-01', '2026-01-02', false],
    [OPERATOR_TYPES.NOT_EQUALS, '10', '11', true],
    [OPERATOR_TYPES.NOT_EQUALS, 'abc', 'abc', false],
    [OPERATOR_TYPES.GREATER_THAN, '11', '10', true],
    [OPERATOR_TYPES.GREATER_THAN, '10', '10', false],
    [OPERATOR_TYPES.LESS_THAN, '9', '10', true],
    [OPERATOR_TYPES.GREATER_THAN_OR_EQUAL, '10', '10', true],
    [OPERATOR_TYPES.LESS_THAN_OR_EQUAL, '11', '10', false],
    [OPERATOR_TYPES.GREATER_THAN, '2026-01-02', '2026-01-01', true],
    [OPERATOR_TYPES.LESS_THAN, '09:00', '10:30', true],
    [OPERATOR_TYPES.GREATER_THAN, 'abc', 'abd', false],
  ] as const)('%s: フィールド %s と %s → %s', (operator, fieldValue, value, expected) => {
    expect(evaluate(operator, fieldValue, value)).toBe(expected);
  });

  it('文字列の includes / notIncludes は部分一致で比べる', () => {
    expect(evaluate(OPERATOR_TYPES.INCLUDES, '東京都港区', '港区')).toBe(true);
    expect(evaluate(OPERATOR_TYPES.NOT_INCLUDES, '東京都港区', '大阪')).toBe(true);
  });

  it('複数選択の includes は、条件の値がすべて選ばれているときに合う', () => {
    expect(evaluate(OPERATOR_TYPES.INCLUDES, ['A', 'B', 'C'], ['A', 'C'])).toBe(true);
    expect(evaluate(OPERATOR_TYPES.INCLUDES, ['A', 'B'], ['A', 'C'])).toBe(false);
  });

  it('複数選択の notIncludes は、条件の値が1つも選ばれていないときに合う', () => {
    expect(evaluate(OPERATOR_TYPES.NOT_INCLUDES, ['A', 'B'], ['C', 'D'])).toBe(true);
    expect(evaluate(OPERATOR_TYPES.NOT_INCLUDES, ['A', 'B'], ['B', 'D'])).toBe(false);
  });

  it('1つだけ選ぶフィールド（ラジオボタンなど）の includes は、条件の値のどれかと完全に一致すれば合う', () => {
    expect(evaluate(OPERATOR_TYPES.INCLUDES, 'B', ['A', 'B'])).toBe(true);
    expect(evaluate(OPERATOR_TYPES.INCLUDES, 'AB', ['A'])).toBe(false);
  });

  it('1つだけ選ぶフィールドの notIncludes は、条件の値のどれとも一致しなければ合う', () => {
    expect(evaluate(OPERATOR_TYPES.NOT_INCLUDES, 'C', ['A', 'B'])).toBe(true);
    expect(evaluate(OPERATOR_TYPES.NOT_INCLUDES, 'B', ['A', 'B'])).toBe(false);
  });

  it('空の値は大小の比較で合わない', () => {
    expect(evaluate(OPERATOR_TYPES.GREATER_THAN, '', '0')).toBe(false);
    expect(evaluate(OPERATOR_TYPES.LESS_THAN, null, '10')).toBe(false);
  });
});
