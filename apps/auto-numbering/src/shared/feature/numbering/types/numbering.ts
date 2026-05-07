import type { FormatPart, SerialConfig } from '@/shared/config/staticSchema';

export type ResolvedPart = {
  type: FormatPart['type'];
  value: string;
};

export type SerialContext = {
  appId: number;
  apiToken?: string;
  resultFieldCode: string;
  serialConfig: SerialConfig;
  connector: string;
  formatString: string;
};

export type DateContext = {
  date: Date;
  yyyy: string;
  mm: string;
  dd: string;
};

export type UpdateRecordParams = {
  appId: number;
  recordId: number;
  resultFieldCode: string;
  numberingValue: string;
  serialConfig: SerialConfig;
  currentSerial: number;
  header: import('./kintone').KintoneProxyHeader;
  revision?: string;
  api?: import('./kintone').KintoneAPI;
};
