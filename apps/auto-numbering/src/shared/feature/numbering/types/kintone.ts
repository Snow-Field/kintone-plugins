/**
 * Kintone型定義
 */

export type KintoneFieldValue = string | number | boolean | null | unknown;

export type KintoneRecord = {
  [fieldCode: string]: {
    type: string;
    value: KintoneFieldValue;
  };
};

export type KintoneEvent = {
  type:
    | 'app.record.create.submit.success'
    | 'app.record.edit.submit.success'
    | 'mobile.app.record.create.submit.success'
    | 'mobile.app.record.edit.submit.success';
  appId: number;
  recordId: number;
  record: KintoneRecord;
};

export type KintoneProxyHeader = Record<string, string>;
export type KintoneProxyData = Record<string, unknown>;

export type KintoneAPI = {
  proxy: (
    url: string,
    method: string,
    header: KintoneProxyHeader,
    data: KintoneProxyData
  ) => Promise<[string, number, Record<string, string>]>;
  api: {
    url: (path: string, detectGuestSpace: boolean) => string;
    urlForGet: (path: string, query: Record<string, unknown>, detectGuestSpace: boolean) => string;
  };
  events: {
    on: (events: string[], handler: (event: any) => any) => void;
  };
};

export type RecordWithRevision = {
  record: KintoneRecord;
  revision: string;
};

export type FetchRecordsResponse = {
  records: KintoneRecord[];
  totalCount: string | null;
};

export type UpdateRecordResponse = {
  revision: string;
};
