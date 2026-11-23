import type { FC } from 'react';
import { useFieldArray, useFormContext, useWatch } from 'react-hook-form';
import { nanoid } from 'nanoid';
import { Box, Button, IconButton, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { FormSecretField, FormSelect, FormTextField } from '@kintone-plugin/ui';
import type { DataValueType, PluginConfig, ProxyMethod } from '@/shared/config';

type Props = { targetIndex: number };

const TYPE_OPTIONS: { value: DataValueType; label: string }[] = [
  { value: 'string', label: '文字' },
  { value: 'number', label: '数値' },
  { value: 'boolean', label: '真偽' },
];

const BOOLEAN_OPTIONS = [
  { value: 'true', label: 'true' },
  { value: 'false', label: 'false' },
];

/** 選んだメソッドに合わせて、本文の値がどう送られるかを説明する */
const describeDelivery = (methods: ProxyMethod[]): string[] => {
  const lines: string[] = [];
  if (methods.some((m) => m === 'GET' || m === 'DELETE')) {
    lines.push(
      'GET・DELETE: URL のクエリ文字列に足されます。呼び出し側が同じキーを付けても消えないので、値を固定することはできません。'
    );
  }
  if (methods.some((m) => m === 'POST' || m === 'PUT')) {
    lines.push(
      'POST・PUT: 呼び出し側の本文がオブジェクトのときに足され、同じキーは保存した値が優先されます（値を固定できます）。本文を文字列（JSON.stringify など）で渡すと足されません。'
    );
  }
  return lines;
};

/** 本文の値の入力。キーは見えたまま、値は伏せ字にする */
export const DataEditor: FC<Props> = ({ targetIndex }) => {
  const { control, setValue } = useFormContext<PluginConfig>();
  const name = `targets.${targetIndex}.data` as const;
  const { fields, append, remove } = useFieldArray({ control, name, keyName: 'fieldKey' });
  const items = useWatch({ control, name }) ?? [];
  const methods = useWatch({ control, name: `targets.${targetIndex}.methods` }) ?? [];

  return (
    <Box>
      <Typography variant='subtitle2' sx={{ mb: 1 }}>
        本文の値（任意）
      </Typography>
      {fields.length > 0 &&
        describeDelivery(methods).map((line) => (
          <Typography
            key={line}
            variant='caption'
            sx={{ display: 'block', mb: 1, color: 'text.secondary' }}
          >
            {line}
          </Typography>
        ))}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {fields.map((field, i) => (
          <Box key={field.fieldKey} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
            <FormTextField<PluginConfig>
              name={`${name}.${i}.key`}
              label='キー'
              size='small'
              sx={{ width: 240 }}
            />
            <FormSelect<PluginConfig>
              name={`${name}.${i}.type`}
              label='種類'
              options={TYPE_OPTIONS}
              size='small'
              sx={{ width: 110 }}
              // 種類を変えたら、前の種類の値は合わないので入れ直してもらう（真偽は true から始める）
              onValueChange={(type) =>
                setValue(`${name}.${i}.value`, type === 'boolean' ? 'true' : '', {
                  shouldValidate: true,
                })
              }
            />
            {items[i]?.type === 'boolean' ? (
              <FormSelect<PluginConfig>
                name={`${name}.${i}.value`}
                label='値'
                options={BOOLEAN_OPTIONS}
                size='small'
                sx={{ flex: 1 }}
              />
            ) : (
              <FormSecretField<PluginConfig>
                name={`${name}.${i}.value`}
                label='値'
                size='small'
                sx={{ flex: 1 }}
              />
            )}
            <IconButton aria-label={`本文の値 ${i + 1} を削除`} onClick={() => remove(i)}>
              <DeleteIcon />
            </IconButton>
          </Box>
        ))}
      </Box>
      <Button
        size='small'
        startIcon={<AddIcon />}
        onClick={() => append({ id: nanoid(), key: '', value: '', type: 'string' })}
        sx={{ mt: 1 }}
      >
        本文の値を足す
      </Button>
    </Box>
  );
};
