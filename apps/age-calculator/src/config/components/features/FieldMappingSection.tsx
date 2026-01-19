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
  FormAutocomplete,
  FormTextField,
} from '@kintone-plugin/ui';

const FieldMappingRow: FC<{ index: number }> = ({ index }) => {
  const { control, setValue } = useFormContext<PluginConfig>();
  const { isDuplicate } = useDuplicateCheck(index, 'conditions');

  // 選択肢を取得
  const { fields: dateFields } = useAppFields(['DATE']);
  const { fields: ageFields } = useAppFields(['SINGLE_LINE_TEXT', 'NUMBER']);

  // 年齢フィールドの選択状態を監視
  const destFieldCode = useWatch({
    control,
    name: `conditions.${index}.destFieldCode`,
  });

  // 選択されたフィールドが「文字列一列」でない場合は、単位を非活性にする
  const selectedField = ageFields.find((field) => field.code === destFieldCode);
  const isDisabledUnit = selectedField ? selectedField.type !== 'SINGLE_LINE_TEXT' : true;

  // 非活性時に値をクリア
  useEffect(() => {
    if (isDisabledUnit) {
      setValue(`conditions.${index}.unit`, '');
    }
  }, [isDisabledUnit, setValue, index]);

  return (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      alignItems={{ xs: 'stretch', sm: 'center' }}
      spacing={2}
      sx={{ width: '100%' }}
    >
      <FormAutocomplete
        name={`conditions.${index}.srcFieldCode`}
        label='生年月日フィールド'
        placeholder='フィールドを選択してください'
        options={dateFields}
        shouldShowOption={(field) => !isDuplicate(field.code, 'srcFieldCode')}
        sx={{ flex: 1, minWidth: 0 }}
      />
      <ArrowForwardIosIcon sx={{ color: '#c1c1c1' }} />
      <FormAutocomplete
        name={`conditions.${index}.destFieldCode`}
        label='年齢フィールド'
        placeholder='フィールドを選択してください'
        options={ageFields}
        shouldShowOption={(field) => !isDuplicate(field.code, 'destFieldCode')}
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
