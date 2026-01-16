import type { FC } from 'react';
import { useFormContext, useFieldArray } from 'react-hook-form';
import { Stack, Box } from '@mui/material';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import { type PluginConfig, getNewCondition } from '@/shared/config';
import { useAppFields, useDuplicateCheck } from '@kintone-plugin/kintone-utils';
import {
  FormSection,
  FormTitle,
  FormDescription,
  DynamicSortableList,
  FormAutocomplete,
} from '@kintone-plugin/ui';

const FieldMappingRow: FC<{ index: number }> = ({ index }) => {
  const { isDuplicate } = useDuplicateCheck(index, 'conditions');

  // 選択肢を取得
  const { fields: dateFields } = useAppFields(['DATE']);
  const { fields: ageFields } = useAppFields(['SINGLE_LINE_TEXT', 'NUMBER']);

  return (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      alignItems={{ xs: 'stretch', sm: 'center' }}
      spacing={2}
      sx={{ width: '100%' }}
    >
      <FormAutocomplete
        name={`conditions.${index}.srcFieldCode`}
        label="生年月日フィールド"
        placeholder="フィールドを選択してください"
        options={dateFields}
        shouldShowOption={(field) => !isDuplicate(field.code, 'srcFieldCode')}
        sx={{ flex: 1, minWidth: 0 }}
      />
      <ArrowForwardIosIcon sx={{ color: '#757575' }} />
      <FormAutocomplete
        name={`conditions.${index}.destFieldCode`}
        label="年齢フィールド"
        placeholder="フィールドを選択してください"
        options={ageFields}
        shouldShowOption={(field) => !isDuplicate(field.code, 'destFieldCode')}
        sx={{ flex: 1, minWidth: 0 }}
      />
    </Stack>
  );
};

export const FieldMappingSection: FC = () => {
  const { control } = useFormContext<PluginConfig>();
  const { fields, append, remove, insert, move } = useFieldArray({ control, name: 'conditions' });

  return (
    <FormSection>
      <FormTitle>フィールドの設定</FormTitle>
      <FormDescription last>
        生年月日フィールドと年齢を表示するフィールドを選択してください。
      </FormDescription>
      <Box sx={{ maxWidth: 840 }}>
        <DynamicSortableList
          items={fields}
          onMove={move}
          onRemove={remove}
          onAdd={(index) => {
            const row = getNewCondition();
            index !== undefined ? insert(index, row) : append(row);
          }}
          addButtonLabel="新しい設定を追加"
          renderItem={(_, index) => <FieldMappingRow index={index} />}
        />
      </Box>
    </FormSection>
  );
};
