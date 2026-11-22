import { type FC, useEffect } from 'react';
import { useFieldArray, useFormContext, useWatch } from 'react-hook-form';
import { Box, Stack } from '@mui/material';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import {
  type AppField,
  type AppFieldType,
  useAppFields,
  useDuplicateCheck,
} from '@kintone-plugin/kintone-utils';
import { FieldSelect } from '@kintone-plugin/plugin-shell';
import { DynamicSortableList, FormSection, FormTextField, Text } from '@kintone-plugin/ui';
import { getNewCondition, type PluginConfig } from '@/shared/config';

/** 生年月日として選べるフィールドの種類 */
const BIRTHDAY_FIELD_TYPES = ['DATE'] as const satisfies readonly AppFieldType[];

/** 年齢を書き込めるフィールドの種類 */
const AGE_FIELD_TYPES = ['SINGLE_LINE_TEXT', 'NUMBER'] as const satisfies readonly AppFieldType[];

const FIELD_TYPE_LABELS: Partial<Record<AppFieldType, string>> = {
  SINGLE_LINE_TEXT: '文字列',
  NUMBER: '数値',
  DATE: '日付',
};

const groupByType = (field: AppField) => FIELD_TYPE_LABELS[field.type] ?? 'その他';

const FieldMappingRow: FC<{ index: number }> = ({ index }) => {
  const { control, setValue } = useFormContext<PluginConfig>();
  const { isDuplicate } = useDuplicateCheck<PluginConfig>(index, 'conditions');
  const { fields: ageFields } = useAppFields(AGE_FIELD_TYPES);

  const destFieldCode = useWatch({ control, name: `conditions.${index}.destFieldCode` });

  // 単位は文字列（1行）のフィールドにだけ付けられる。それ以外を選んだら入力できなくし、空にする。
  // 保存したフィールドがアプリに見つからないときは、選び直すまで単位を残す（動的な検証がエラーを出す）
  const destField = ageFields.find((field) => field.code === destFieldCode);
  const isUnitDisabled = destField?.type !== 'SINGLE_LINE_TEXT';
  const shouldClearUnit = destFieldCode === '' || (destField !== undefined && isUnitDisabled);

  useEffect(() => {
    if (shouldClearUnit) {
      setValue(`conditions.${index}.unit`, '', { shouldDirty: true, shouldValidate: false });
    }
  }, [shouldClearUnit, setValue, index]);

  return (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      spacing={2}
      sx={{ alignItems: { xs: 'stretch', sm: 'center' }, width: '100%' }}
    >
      <FieldSelect<PluginConfig>
        name={`conditions.${index}.srcFieldCode`}
        label='生年月日フィールド'
        placeholder='フィールドを選択してください'
        fieldTypes={BIRTHDAY_FIELD_TYPES}
        // ほかの行で選んだフィールドは選べないようにする
        filter={(field) => !isDuplicate(field.code, 'srcFieldCode')}
        groupBy={groupByType}
        sx={{ flex: 1, minWidth: 0 }}
      />
      <ArrowForwardIosIcon sx={{ color: 'text.disabled' }} />
      <FieldSelect<PluginConfig>
        name={`conditions.${index}.destFieldCode`}
        label='年齢フィールド'
        placeholder='フィールドを選択してください'
        fieldTypes={AGE_FIELD_TYPES}
        filter={(field) => !isDuplicate(field.code, 'destFieldCode')}
        groupBy={groupByType}
        sx={{ flex: 1, minWidth: 0 }}
      />
      <FormTextField<PluginConfig>
        name={`conditions.${index}.unit`}
        label='単位'
        placeholder='歳'
        sx={{ width: '100px' }}
        disabled={isUnitDisabled}
      />
    </Stack>
  );
};

export const FieldMappingSection: FC = () => {
  const { control } = useFormContext<PluginConfig>();
  const { fields, append, remove, insert, move } = useFieldArray({ control, name: 'conditions' });

  return (
    <FormSection>
      <Text variant='sectionTitle'>フィールドの設定</Text>
      <Text variant='description' last>
        生年月日フィールドと年齢を表示するフィールドを選択してください。
      </Text>
      <Box sx={{ maxWidth: 940 }}>
        <DynamicSortableList
          items={fields}
          onMove={move}
          onRemove={remove}
          onAdd={(index) => {
            const row = getNewCondition();
            index !== undefined ? insert(index, row) : append(row);
          }}
          addButtonLabel='新しい設定を追加'
          renderItem={(_, index) => <FieldMappingRow index={index} />}
        />
      </Box>
    </FormSection>
  );
};
