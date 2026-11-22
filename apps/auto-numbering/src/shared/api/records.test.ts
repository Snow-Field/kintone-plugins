import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getAllRecords } = vi.hoisted(() => ({ getAllRecords: vi.fn() }));
vi.mock('@kintone/rest-api-client', () => ({
  KintoneRestAPIClient: class {
    record = { getAllRecords };
  },
}));
vi.stubGlobal('location', { origin: 'https://example.cybozu.com' });

const { checkDuplicate } = await import('./records');

describe('checkDuplicate', () => {
  beforeEach(() => {
    getAllRecords.mockReset();
    getAllRecords.mockResolvedValue([]);
  });

  it('採番値に " が含まれていても、エスケープして検索する', async () => {
    await checkDuplicate(1, 'number', 'A"B-00001', new Set());

    expect(getAllRecords).toHaveBeenCalledWith(
      expect.objectContaining({ condition: 'number = "A\\"B-00001"' })
    );
  });

  it('既存の採番値のキャッシュがあれば、API を呼ばずに確かめる', async () => {
    await expect(checkDuplicate(1, 'number', 'X-1', new Set(['X-1']))).resolves.toBe(true);
    expect(getAllRecords).not.toHaveBeenCalled();
  });
});
