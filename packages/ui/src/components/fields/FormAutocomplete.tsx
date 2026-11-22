import { useMemo } from 'react';
import { Controller, type FieldPath, type FieldValues, useFormContext } from 'react-hook-form';
import { Autocomplete, Checkbox, TextField } from '@mui/material';
import type { AutocompleteProps } from '@mui/material';

/** 選択肢の基本の形。`value` がフォームに保存される */
export type FormAutocompleteOption = {
  value: string;
  label: string;
};

/** React Hook Form が管理するため、外から受け取らない props */
type ManagedProps =
  | 'options'
  | 'value'
  | 'defaultValue'
  | 'onChange'
  | 'renderInput'
  | 'multiple'
  | 'freeSolo'
  | 'disableClearable';

export type FormAutocompleteProps<
  TFieldValues extends FieldValues = FieldValues,
  TOption extends FormAutocompleteOption = FormAutocompleteOption,
> = {
  name: FieldPath<TFieldValues>;
  label?: string;
  placeholder?: string;
  options: readonly TOption[];
  /** true のとき値は `string[]`、それ以外は `string`（未選択は `''`） */
  multiple?: boolean;
  /** 利用者が値を変えた後に呼ぶ。ほかの項目のリセットなどに使う */
  onValueChange?: (value: string | string[]) => void;
} & Omit<AutocompleteProps<TOption, boolean, false, false>, ManagedProps>;

/**
 * 選択肢から選ぶ入力欄（MUI の Autocomplete を React Hook Form につないだもの）
 * フォームには選択肢の `value` を保存する。選択肢に無い値が保存されていると、未選択として表示する
 */
export const FormAutocomplete = <
  TFieldValues extends FieldValues = FieldValues,
  TOption extends FormAutocompleteOption = FormAutocompleteOption,
>({
  name,
  label,
  placeholder,
  options,
  multiple = false,
  onValueChange,
  groupBy,
  getOptionLabel = (option) => option.label,
  renderOption,
  onBlur,
  ...autocompleteProps
}: FormAutocompleteProps<TFieldValues, TOption>) => {
  const { control } = useFormContext<TFieldValues>();

  // MUI の Autocomplete は、groupBy を使うとき同じグループの選択肢が並んでいる必要がある
  // グループは最初に現れた順、グループの中は渡された順のまま並べる
  const sortedOptions = useMemo(() => {
    if (!groupBy) return options;
    const groups = new Map<string, TOption[]>();
    for (const option of options) {
      const group = groupBy(option);
      const list = groups.get(group);
      if (list) list.push(option);
      else groups.set(group, [option]);
    }
    return [...groups.values()].flat();
  }, [options, groupBy]);

  const optionMap = useMemo(() => new Map(options.map((o) => [o.value, o])), [options]);

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => {
        const selected = multiple
          ? (Array.isArray(field.value) ? field.value : []).flatMap((v) => {
              const option = optionMap.get(v);
              return option ? [option] : [];
            })
          : typeof field.value === 'string'
            ? (optionMap.get(field.value) ?? null)
            : null;

        return (
          <Autocomplete
            disableCloseOnSelect={multiple}
            {...autocompleteProps}
            multiple={multiple}
            options={sortedOptions}
            value={selected}
            groupBy={groupBy}
            getOptionLabel={getOptionLabel}
            // 既定ではラベルを key に使うため、ラベルが重なると一覧の行を取り違える
            getOptionKey={(option) => option.value}
            isOptionEqualToValue={(option, value) => option.value === value.value}
            onChange={(_, next) => {
              const value = Array.isArray(next) ? next.map((o) => o.value) : (next?.value ?? '');
              field.onChange(value);
              onValueChange?.(value);
            }}
            onBlur={(event) => {
              field.onBlur();
              onBlur?.(event);
            }}
            renderOption={
              renderOption ??
              (multiple
                ? // 複数選ぶときは、選んだ状態が分かるようにチェックボックスを付ける
                  (props, option, { selected: checked }) => {
                    const { key, ...rest } = props;
                    return (
                      <li key={key} {...rest}>
                        <Checkbox
                          size='small'
                          checked={checked}
                          tabIndex={-1}
                          disableRipple
                          sx={{ mr: 1, p: 0 }}
                        />
                        {getOptionLabel(option)}
                      </li>
                    );
                  }
                : undefined)
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label={label}
                placeholder={placeholder}
                inputRef={field.ref}
                error={!!error}
                helperText={error?.message}
              />
            )}
          />
        );
      }}
    />
  );
};
