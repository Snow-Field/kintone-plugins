// --- 基本ユーティリティ ---
type FieldWith<T extends string, V> = {
  type: T;
  value: V;
};

type Entity = {
  code: string;
  name: string;
};

type FileInformation = {
  contentType: string;
  fileKey: string;
  name: string;
  size: string;
};

// --- フィールド定義のマップ ---
export type FieldMap = {
  RECORD_NUMBER: string;
  __ID__: string;
  __REVISION__: string;
  CREATOR: Entity;
  CREATED_TIME: string;
  MODIFIER: Entity;
  UPDATED_TIME: string;
  SINGLE_LINE_TEXT: string;
  MULTI_LINE_TEXT: string;
  RICH_TEXT: string;
  NUMBER: string;
  CALC: string;
  CHECK_BOX: string[];
  RADIO_BUTTON: string | null;
  MULTI_SELECT: string[];
  DROP_DOWN: string | null;
  USER_SELECT: Entity[];
  ORGANIZATION_SELECT: Entity[];
  GROUP_SELECT: Entity[];
  DATE: string | null;
  TIME: string | null;
  DATETIME: string;
  LINK: string;
  FILE: FileInformation[];
  CATEGORY: string[];
  STATUS: string;
  STATUS_ASSIGNEE: Entity[];
};

// --- 各型を自動生成 ---
export type RecordNumber = FieldWith<'RECORD_NUMBER', FieldMap['RECORD_NUMBER']>;
export type Id = FieldWith<'__ID__', FieldMap['__ID__']>;
export type Revision = FieldWith<'__REVISION__', FieldMap['__REVISION__']>;
export type Creator = FieldWith<'CREATOR', FieldMap['CREATOR']>;
export type CreatedTime = FieldWith<'CREATED_TIME', FieldMap['CREATED_TIME']>;
export type Modifier = FieldWith<'MODIFIER', FieldMap['MODIFIER']>;
export type UpdatedTime = FieldWith<'UPDATED_TIME', FieldMap['UPDATED_TIME']>;
export type SingleLineText = FieldWith<'SINGLE_LINE_TEXT', FieldMap['SINGLE_LINE_TEXT']>;
export type MultiLineText = FieldWith<'MULTI_LINE_TEXT', FieldMap['MULTI_LINE_TEXT']>;
export type RichText = FieldWith<'RICH_TEXT', FieldMap['RICH_TEXT']>;
export type Number = FieldWith<'NUMBER', FieldMap['NUMBER']>;
export type Calc = FieldWith<'CALC', FieldMap['CALC']>;
export type CheckBox = FieldWith<'CHECK_BOX', FieldMap['CHECK_BOX']>;
export type RadioButton = FieldWith<'RADIO_BUTTON', FieldMap['RADIO_BUTTON']>;
export type MultiSelect = FieldWith<'MULTI_SELECT', FieldMap['MULTI_SELECT']>;
export type DropDown = FieldWith<'DROP_DOWN', FieldMap['DROP_DOWN']>;
export type UserSelect = FieldWith<'USER_SELECT', FieldMap['USER_SELECT']>;
export type OrganizationSelect = FieldWith<'ORGANIZATION_SELECT', FieldMap['ORGANIZATION_SELECT']>;
export type GroupSelect = FieldWith<'GROUP_SELECT', FieldMap['GROUP_SELECT']>;
export type Date = FieldWith<'DATE', FieldMap['DATE']>;
export type Time = FieldWith<'TIME', FieldMap['TIME']>;
export type DateTime = FieldWith<'DATETIME', FieldMap['DATETIME']>;
export type Link = FieldWith<'LINK', FieldMap['LINK']>;
export type File = FieldWith<'FILE', FieldMap['FILE']>;
export type Category = FieldWith<'CATEGORY', FieldMap['CATEGORY']>;
export type Status = FieldWith<'STATUS', FieldMap['STATUS']>;
export type StatusAssignee = FieldWith<'STATUS_ASSIGNEE', FieldMap['STATUS_ASSIGNEE']>;

// --- サブテーブルの定義 ---
type InSubtableKeys = Exclude<
  keyof FieldMap,
  '__ID__' | '__REVISION__' | 'RECORD_NUMBER' | 'CATEGORY' | 'STATUS' | 'STATUS_ASSIGNEE'
>;

export type InSubtable = {
  [K in InSubtableKeys]: FieldWith<K, FieldMap[K]>;
}[InSubtableKeys];

export type SubtableRow<T extends Record<string, InSubtable>> = {
  id: string;
  value: T;
};

export type Subtable<T extends Record<string, InSubtable>> = FieldWith<
  'SUBTABLE',
  Array<SubtableRow<T>>
>;

// --- 全フィールドの Union ---
export type OneOf =
  | { [K in keyof FieldMap]: FieldWith<K, FieldMap[K]> }[keyof FieldMap]
  | Subtable<Record<string, InSubtable>>;

// --- 全フィールドタイプの Union ---
export type FieldType = keyof FieldMap | 'SUBTABLE' | 'REFERENCE_TABLE' | 'GROUP';
