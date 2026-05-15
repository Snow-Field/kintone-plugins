import type { FormatPart, SerialConfig, ConnectorsSchema } from '@/shared/config/staticSchema';
import type { z } from 'zod';

export type ResolvedPart = {
  type: FormatPart['type'];
  value: string;
};

export type SerialContext = {
  appId: string | number;
  apiToken?: string;
  resultFieldCode: string;
  serialConfig: SerialConfig;
  connector: z.infer<typeof ConnectorsSchema>;
  formatString: string;
};

export type DateContext = {
  date: Date;
  yyyy: string;
  mm: string;
  dd: string;
};

export type UpdateRecordParams = {
  appId: string | number;
  recordId: string | number;
  resultFieldCode: string;
  numberingValue: string;
  serialConfig: SerialConfig;
  currentSerial: number;
  revision?: string | number;
  apiToken?: string;
};
