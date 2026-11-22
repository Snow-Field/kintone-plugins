import { describe, expect, it } from 'vitest';
import { createConfigSchema, getCompatibleOperators } from './dynamicSchema';
import { OPERATOR_TYPES, type PluginConfig } from './staticSchema';

const config = (
  condition: PluginConfig['disableRules'][number]['block']['conditions'][number],
  targetFields = ['target']
): PluginConfig => ({
  version: 1,
  visibilityRules: [],
  disableRules: [
    {
      id: 'r1',
      enabled: true,
      block: { conditions: [condition], logic: 'AND', triggers: ['app.record.edit.show'] },
      targetFields,
    },
  ],
});

const schema = createConfigSchema([
  { code: 'target', type: 'SINGLE_LINE_TEXT' },
  { code: 'amount', type: 'NUMBER' },
  { code: 'tags', type: 'CHECK_BOX' },
]);

/** 検証エラーの場所（path）の一覧 */
const issuePaths = (value: PluginConfig) => {
  const result = schema.safeParse(value);
  return result.success ? [] : result.error.issues.map((issue) => issue.path.join('.'));
};

describe('createConfigSchema', () => {
  it('アプリにあるフィールドと、種類に合う演算子なら通る', () => {
    expect(
      issuePaths(config({ field: 'amount', operator: OPERATOR_TYPES.GREATER_THAN, value: '1' }))
    ).toEqual([]);
  });

  it('アプリに無い対象フィールドと条件のフィールドをエラーにする', () => {
    expect(
      issuePaths(config({ field: 'removed', operator: OPERATOR_TYPES.EQUALS, value: '' }, ['gone']))
    ).toEqual(['disableRules.0.targetFields.0', 'disableRules.0.block.conditions.0.field']);
  });

  it('フィールドの種類に合わない演算子をエラーにする', () => {
    expect(
      issuePaths(config({ field: 'tags', operator: OPERATOR_TYPES.GREATER_THAN, value: 'A' }))
    ).toEqual(['disableRules.0.block.conditions.0.operator']);
  });
});

describe('createConfigSchema: 値が空の条件', () => {
  it('含む・大小の比較で値が空ならエラーにする', () => {
    expect(
      issuePaths(config({ field: 'target', operator: OPERATOR_TYPES.INCLUDES, value: '' }))
    ).toEqual(['disableRules.0.block.conditions.0.value']);
    expect(
      issuePaths(config({ field: 'tags', operator: OPERATOR_TYPES.INCLUDES, value: [] }))
    ).toEqual(['disableRules.0.block.conditions.0.value']);
  });

  it('等しい・等しくないは、空のときの条件として値が空でも通す', () => {
    expect(
      issuePaths(config({ field: 'target', operator: OPERATOR_TYPES.EQUALS, value: '' }))
    ).toEqual([]);
  });
});

describe('getCompatibleOperators', () => {
  it('互換性の表に無い種類は、含む・含まないだけ', () => {
    expect(getCompatibleOperators('LINK')).toEqual([
      OPERATOR_TYPES.INCLUDES,
      OPERATOR_TYPES.NOT_INCLUDES,
    ]);
  });
});
