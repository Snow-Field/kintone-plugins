import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { EventRecord, PluginLogger, RecordEvent } from '@kintone-plugin/kintone-utils';
import type { PluginConfig } from '@/shared/config';
import { disableAgeFields, updateAges } from './record';

const logger = {
  group: vi.fn(),
  groupEnd: vi.fn(),
  log: vi.fn(),
} as unknown as PluginLogger;

const config = (overrides: Partial<PluginConfig['advanced']> = {}): PluginConfig => ({
  version: 2,
  conditions: [{ id: 'a', srcFieldCode: 'birthday', destFieldCode: 'age', unit: '歳' }],
  advanced: { isUpdateOnSave: false, ...overrides },
});

const event = (record: EventRecord): RecordEvent<'app.record.create.submit'> => ({
  type: 'app.record.create.submit',
  appId: 1,
  recordId: undefined,
  record,
});

describe('updateAges', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 10, 23, 12, 0, 0));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('生年月日から年齢を計算し、単位を付けて書き込む', () => {
    const e = event({
      birthday: { type: 'DATE', value: '2000-04-01' },
      age: { type: 'SINGLE_LINE_TEXT', value: '' },
    });
    updateAges(e, config(), logger);
    expect(e.record.age?.value).toBe('26歳');
  });

  it('誕生日が空なら、年齢を空にする（NaN を書き込まない）', () => {
    const e = event({
      birthday: { type: 'DATE', value: null },
      age: { type: 'SINGLE_LINE_TEXT', value: '20歳' },
    });
    updateAges(e, config({ isUpdateOnSave: true }), logger);
    expect(e.record.age?.value).toBe('');
  });

  it('設定したフィールドがレコードに無ければ何もしない', () => {
    const e = event({ birthday: { type: 'DATE', value: '2000-04-01' } });
    expect(() => updateAges(e, config(), logger)).not.toThrow();
    expect(e.record).toEqual({ birthday: { type: 'DATE', value: '2000-04-01' } });
  });

  it('年齢のフィールドが書き込めない種類に変えられていたら何もしない', () => {
    const e = event({
      birthday: { type: 'DATE', value: '2000-04-01' },
      age: { type: 'DATE', value: '2020-01-01' },
    });
    updateAges(e, config(), logger);
    expect(e.record.age?.value).toBe('2020-01-01');
  });
});

describe('disableAgeFields', () => {
  it('年齢のフィールドを編集できないようにする', () => {
    const e = event({
      birthday: { type: 'DATE', value: '2000-04-01' },
      age: { type: 'NUMBER', value: '' },
    });
    disableAgeFields(e, config(), logger);
    expect(e.record.age?.disabled).toBe(true);
    expect(e.record.birthday?.disabled).toBeUndefined();
  });

  it('フィールドの種類が変えられていて書き込めないときは、編集できるままにする', () => {
    const e = event({
      birthday: { type: 'SINGLE_LINE_TEXT', value: '2000-04-01' },
      age: { type: 'NUMBER', value: '' },
    });
    disableAgeFields(e, config(), logger);
    expect(e.record.age?.disabled).toBeUndefined();
  });
});
