import { useEffect, type FC } from 'react';
import { useFormContext, useFieldArray, useWatch } from 'react-hook-form';
import { Stack, Box } from '@mui/material';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import { type PluginConfig, getNewCondition } from '@/shared/config';
import { useAppFields, useDuplicateCheck } from '@kintone-plugin/kintone-utils';
import {
  FormSection,
  Text,
  DynamicSortableList,
  FormSingleAutocomplete,
  FormTextField,
  type AutoCompleteOption,
} from '@kintone-plugin/ui';

const fieldTypeLabelMap: Record<string, string> = {
  SINGLE_LINE_TEXT: '文字列',
  NUMBER: '数値',
  DATE: '日付',
};

// グループ化
const getGroupLabel = (option: AutoCompleteOption) =>
  fieldTypeLabelMap[option.type as string] || 'その他';

const FieldMappingRow: FC<{
  index: number;
  dateFields: AutoCompleteOption[];
  ageFields: AutoCompleteOption[];
}> = ({ index, dateFields, ageFields }) => {
  const { control, setValue } = useFormContext<PluginConfig>();
  const { isDuplicate } = useDuplicateCheck(index, 'conditions');

  // 年齢フィールドの選択状態を監視
  const destFieldCode = useWatch({
    control,
    name: `conditions.${index}.destFieldCode`,
  });

  // 選択されたフィールドが「文字列一列」でない場合は、単位を非活性にする
  const selectedField = ageFields.find((field) => field.code === destFieldCode);
  const isDisabledUnit = selectedField ? selectedField.type !== 'SINGLE_LINE_TEXT' : true;

  // 非活性時に単位をクリア
  useEffect(() => {
    if (isDisabledUnit) {
      setValue(`conditions.${index}.unit`, '', { shouldDirty: true, shouldValidate: false });
    }
  }, [isDisabledUnit, setValue, index]);

  // 選択されたフィールドを除外
  const filteredDateOptions = dateFields.filter(
    (field) => !isDuplicate(field.code, 'srcFieldCode')
  );
  const filteredAgeOptions = ageFields.filter((field) => !isDuplicate(field.code, 'destFieldCode'));

  return (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      alignItems={{ xs: 'stretch', sm: 'center' }}
      spacing={2}
      sx={{ width: '100%' }}
    >
      <FormSingleAutocomplete
        name={`conditions.${index}.srcFieldCode`}
        label='生年月日フィールド'
        placeholder='フィールドを選択してください'
        options={filteredDateOptions}
        groupBy={getGroupLabel}
        sx={{ flex: 1, minWidth: 0 }}
      />
      <ArrowForwardIosIcon sx={{ color: '#c1c1c1' }} />
      <FormSingleAutocomplete
        name={`conditions.${index}.destFieldCode`}
        label='年齢フィールド'
        placeholder='フィールドを選択してください'
        options={filteredAgeOptions}
        groupBy={getGroupLabel}
        sx={{ flex: 1, minWidth: 0 }}
      />
      <FormTextField
        name={`conditions.${index}.unit`}
        label='単位'
        placeholder='歳'
        sx={{ width: '100px' }}
        disabled={isDisabledUnit}
      />
    </Stack>
  );
};

export const FieldMappingSection: FC = () => {
  const { control } = useFormContext<PluginConfig>();
  const { fields, append, remove, insert, move } = useFieldArray({ control, name: 'conditions' });

  // 選択肢を取得
  const { fields: dateFields } = useAppFields(['DATE']);
  const { fields: ageFields } = useAppFields(['SINGLE_LINE_TEXT', 'NUMBER']);

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
          renderItem={(_, index) => (
            <FieldMappingRow index={index} dateFields={dateFields} ageFields={ageFields} />
          )}
        />
      </Box>
    </FormSection>
  );
};
