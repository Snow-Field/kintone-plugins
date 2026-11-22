import type { FC } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { Box } from '@mui/material';
import type { AppFieldType } from '@kintone-plugin/kintone-utils';
import { FieldSelect } from '@kintone-plugin/plugin-shell';
import { FormSelect, FormTextField } from '@kintone-plugin/ui';
import type { PluginConfig } from '@/shared/config';
import { DATE_FORMATS, DATE_SOURCE } from '@/shared/config/constants';

/** フィールドのパーツで選べるフィールドの種類 */
const FIELD_PART_TYPES = [
  'SINGLE_LINE_TEXT',
  'NUMBER',
  'CALC',
  'RADIO_BUTTON',
  'DROP_DOWN',
  'DATE',
  'DATETIME',
] as const satisfies readonly AppFieldType[];

/** パーツの種類の選択肢 */
const PART_TYPE_OPTIONS = [
  { value: 'text', label: 'テキスト' },
  { value: 'field', label: 'フィールド' },
  { value: 'date', label: '日付' },
] as const;

/** 日付の元の選択肢 */
const DATE_SOURCE_OPTIONS = [
  { value: DATE_SOURCE.NOW, label: '現在日時' },
  { value: DATE_SOURCE.CREATED_AT, label: 'レコード作成日時' },
] as const;

/** 日付の書式の選択肢 */
const DATE_FORMAT_OPTIONS = [
  { value: DATE_FORMATS.YYYYMMDD, label: 'YYYYMMDD（例: 20260530）' },
  { value: DATE_FORMATS.YYMMDD, label: 'YYMMDD（例: 260530）' },
  { value: DATE_FORMATS.YYYYMM, label: 'YYYYMM（例: 202605）' },
  { value: DATE_FORMATS.YYMM, label: 'YYMM（例: 2605）' },
  { value: DATE_FORMATS.YYYY, label: 'YYYY（例: 2026）' },
  { value: DATE_FORMATS.YY, label: 'YY（例: 26）' },
] as const;

type Props = {
  settingIndex: number;
  partIndex: number;
};

/**
 * 個別フォーマットパーツの編集コンポーネント（インライン形式）
 * パーツの種類に応じて、横並びの入力欄を切り替える
 */
export const FormatPartItem: FC<Props> = ({ settingIndex, partIndex }) => {
  const { control } = useFormContext<PluginConfig>();
  const partPath = `numberingSettings.${settingIndex}.formatParts.${partIndex}` as const;
  const partType = useWatch({ control, name: `${partPath}.type` });

  return (
    <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start', flexWrap: 'wrap' }}>
      <FormSelect<PluginConfig>
        name={`${partPath}.type`}
        label='種類'
        options={PART_TYPE_OPTIONS}
        size='small'
        sx={{ minWidth: 120, maxWidth: 150 }}
      />

      {partType === 'text' && (
        <FormTextField<PluginConfig>
          name={`${partPath}.value`}
          label='固定文字列'
          size='small'
          sx={{ flex: 1, minWidth: 200, maxWidth: 400 }}
        />
      )}

      {partType === 'field' && (
        <FieldSelect<PluginConfig>
          name={`${partPath}.fieldCode`}
          label='フィールド'
          fieldTypes={FIELD_PART_TYPES}
          size='small'
          sx={{ flex: 1, minWidth: 200, maxWidth: 400 }}
        />
      )}

      {partType === 'date' && (
        <>
          <FormSelect<PluginConfig>
            name={`${partPath}.format`}
            label='フォーマット'
            options={DATE_FORMAT_OPTIONS}
            size='small'
            sx={{ minWidth: 150, maxWidth: 220 }}
          />
          <FormSelect<PluginConfig>
            name={`${partPath}.source`}
            label='日付ソース'
            options={DATE_SOURCE_OPTIONS}
            size='small'
            sx={{ minWidth: 150, maxWidth: 200 }}
          />
        </>
      )}
    </Box>
  );
};
