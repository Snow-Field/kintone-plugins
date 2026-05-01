/**
 * 採番システム型定義
 */

export enum DATE_SOURCE {
  NOW = 'now',
  CREATED_AT = 'createdAt',
}

export enum DATE_FORMATS {
  YYYYMMDD = 'YYYYMMDD',
  YYMMDD = 'YYMMDD',
  YYYYMM = 'YYYYMM',
  YYMM = 'YYMM',
  YYYY = 'YYYY',
  YY = 'YY',
}

export enum CONNECTORS {
  HYPHEN = '-',
  // UNDERSCORE = '_',
}

export enum RESET_TIMING {
  NONE = 'none',
  YEARLY = 'yearly',
  MONTHLY = 'monthly',
  DAILY = 'daily',
}

export type FormatText = {
  type: 'text';
  value: string;
};

export type FormatField = {
  type: 'field';
  fieldCode: string;
};

export type FormatDate = {
  type: 'date';
  source: DATE_SOURCE;
  format: DATE_FORMATS;
};

export type FormatPart = FormatText | FormatField | FormatDate;

export type SerialConfig = {
  initialValue: number;
  digit: number;
  position: 'prefix' | 'suffix';
  resetTiming: RESET_TIMING;
  /** resetTiming が 'none' の場合のみ必要。連番を保存するフィールドコード */
  serialFieldCode?: string;
};

export type NumberingSettings = {
  resultFieldCode: string;
  apiToken?: string;

  /** 採番形式 */
  formatParts: FormatPart[];
  connector: CONNECTORS;

  /** 連番設定 */
  serialConfig: SerialConfig;

  /** エラー処理 */
  maxRetryCount: number;
};

export type ResolvedPart = {
  type: FormatPart['type'];
  value: string;
};

export type SerialContext = {
  appId: number;
  apiToken?: string;
  resultFieldCode: string;
  serialConfig: SerialConfig;
  connector: CONNECTORS;
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
