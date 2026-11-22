import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getRecords } = vi.hoisted(() => ({ getRecords: vi.fn() }));
vi.mock('@kintone/rest-api-client', () => ({
  KintoneRestAPIClient: class {
    record = { getRecords };
  },
}));
vi.stubGlobal('location', { origin: 'https://example.cybozu.com' });

const { checkDuplicate } = await import('./records');
const { resolveNextSerial } = await import('./serial');

/** getRecords に渡した検索条件の一覧 */
const queries = () => getRecords.mock.calls.map(([params]) => params.query);

const serialConfig = {
  initialValue: 1,
  digit: 5,
  position: 'suffix' as const,
  resetTiming: 'none' as const,
  serialFieldCode: 'serial',
};

describe('checkDuplicate', () => {
  beforeEach(() => {
    getRecords.mockReset();
    getRecords.mockResolvedValue({ records: [] });
  });

  it('採番値に " が含まれていても、エスケープして完全一致で検索する', async () => {
    await checkDuplicate(1, 'number', 'A"B-00001', new Set());
    expect(queries()).toEqual(['number = "A\\"B-00001" order by $id desc limit 1']);
  });

  it('既存の採番値に含まれていれば、API を呼ばずに重複とする', async () => {
    await expect(checkDuplicate(1, 'number', 'X-1', new Set(['X-1']))).resolves.toBe(true);
    expect(getRecords).not.toHaveBeenCalled();
  });

  it('既存の採番値に含まれていなくても、API で確かめる（取得した件数に上限があるため）', async () => {
    getRecords.mockResolvedValue({
      records: [{ number: { type: 'SINGLE_LINE_TEXT', value: 'X-2' } }],
    });
    await expect(checkDuplicate(1, 'number', 'X-2', new Set(['X-1']))).resolves.toBe(true);
  });
});

describe('resolveNextSerial', () => {
  beforeEach(() => {
    getRecords.mockReset();
  });

  it('リセットしないときは、連番のフィールドの最大値に1を足す', async () => {
    getRecords.mockResolvedValue({ records: [{ serial: { type: 'NUMBER', value: '41' } }] });
    const result = await resolveNextSerial({
      appId: 1,
      resultFieldCode: 'number',
      serialConfig,
      connector: '-',
      formatString: 'XX',
    });
    expect(result.nextSerial).toBe(42);
    expect(queries()).toEqual(['serial != "" order by serial desc limit 1']);
  });

  it('期間でリセットするときは、同じ書式の採番値だけから最大の連番を探す', async () => {
    getRecords.mockResolvedValue({
      records: [
        { number: { type: 'SINGLE_LINE_TEXT', value: 'XX-26-00003' } },
        // like は部分一致なので、別の書式の採番値も返ってくる
        { number: { type: 'SINGLE_LINE_TEXT', value: 'AXX-26-00099' } },
      ],
    });
    const result = await resolveNextSerial({
      appId: 1,
      resultFieldCode: 'number',
      serialConfig: { ...serialConfig, resetTiming: 'yearly', serialFieldCode: '' },
      connector: '-',
      formatString: 'XX-26',
    });
    expect(result.nextSerial).toBe(4);
    expect([...result.existingValues]).toEqual(['XX-26-00003']);
    expect(queries()).toEqual(['number like "XX-26" order by $id desc limit 500']);
  });
});
