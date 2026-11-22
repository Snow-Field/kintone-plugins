import { useMemo } from 'react';
import { type FieldValues, useWatch } from 'react-hook-form';
import { Box, Checkbox, createFilterOptions, Typography } from '@mui/material';
import { type AppField, type AppFieldType, useAppFields } from '@kintone-plugin/kintone-utils';
import {
  FormAutocomplete,
  type FormAutocompleteOption,
  type FormAutocompleteProps,
} from '@kintone-plugin/ui';

/** `value` はフィールドコード */
type FieldOption = FormAutocompleteOption & { field: AppField };

export type FieldSelectProps<TFieldValues extends FieldValues = FieldValues> = Omit<
  FormAutocompleteProps<TFieldValues, FieldOption>,
  'options' | 'groupBy' | 'filterOptions' | 'renderOption' | 'getOptionLabel'
> & {
  /** 選べるフィールドの種類。省略するとすべてのフィールド */
  fieldTypes?: readonly AppFieldType[];
  /**
   * false を返したフィールドを選択肢から外す（ほかの行で選んだフィールドを外すなど）
   * この入力欄で選んでいるフィールドは、false を返しても外さない（外すと未選択に見えるため）
   */
  filter?: (field: AppField) => boolean;
  /** フィールドを見出しごとにまとめて表示する */
  groupBy?: (field: AppField) => string;
};

// フィールド名とフィールドコードのどちらでも絞り込めるようにする
const filterOptions = createFilterOptions<FieldOption>({
  stringify: (option) => `${option.label} ${option.value}`,
});

/**
 * アプリのフィールドを選ぶ入力欄。フォームにはフィールドコードを保存する
 * フィールドの一覧を読み込む間は描画を止める（Suspense）ため、plugin-shell の設定画面の中で使う
 */
export const FieldSelect = <TFieldValues extends FieldValues = FieldValues>({
  fieldTypes,
  filter,
  groupBy,
  multiple = false,
  ...props
}: FieldSelectProps<TFieldValues>) => {
  const { fields } = useAppFields(fieldTypes);
  const current: unknown = useWatch<TFieldValues>({ name: props.name });

  const options = useMemo(() => {
    const selected = new Set(Array.isArray(current) ? current : [current]);
    return fields
      .filter((field) => !filter || filter(field) || selected.has(field.code))
      .map((field): FieldOption => ({ value: field.code, label: field.label, field }));
  }, [fields, filter, current]);

  return (
    <FormAutocomplete<TFieldValues, FieldOption>
      {...props}
      multiple={multiple}
      options={options}
      groupBy={groupBy && ((option) => groupBy(option.field))}
      filterOptions={filterOptions}
      renderOption={(optionProps, option, { selected }) => {
        const { key, ...rest } = optionProps;
        return (
          <li key={key} {...rest}>
            {multiple && (
              <Checkbox
                size='small'
                checked={selected}
                tabIndex={-1}
                disableRipple
                sx={{ mr: 1, p: 0 }}
              />
            )}
            <Box>
              <Typography variant='body2'>{option.label}</Typography>
              <Typography variant='caption' sx={{ color: 'text.secondary' }}>
                {option.value}
              </Typography>
            </Box>
          </li>
        );
      }}
    />
  );
};
