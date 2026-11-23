import { useState } from 'react';
import type { FieldValues } from 'react-hook-form';
import { IconButton, InputAdornment } from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { FormTextField, type FormTextFieldProps } from './FormTextField';

export type FormSecretFieldProps<TFieldValues extends FieldValues = FieldValues> = Omit<
  FormTextFieldProps<TFieldValues>,
  'type' | 'multiline'
>;

/**
 * API トークンなどの秘密を入力する欄。既定は伏せ字で、ボタンで表示を切り替える
 * ブラウザがログインのパスワードを自動入力しないよう、autoComplete は new-password にする（off は無視される）
 */
export const FormSecretField = <TFieldValues extends FieldValues = FieldValues>({
  label,
  slotProps,
  ...props
}: FormSecretFieldProps<TFieldValues>) => {
  const [visible, setVisible] = useState(false);
  const toggleLabel = visible ? `${label ?? '値'}を隠す` : `${label ?? '値'}を表示する`;

  return (
    <FormTextField<TFieldValues>
      autoComplete='new-password'
      spellCheck={false}
      {...props}
      label={label}
      type={visible ? 'text' : 'password'}
      slotProps={{
        ...slotProps,
        input: {
          // 呼び出し側が渡した input の指定（readOnly など）は残し、表示を切り替えるボタンだけを足す
          // （関数で渡す形には対応しない）
          ...(typeof slotProps?.input === 'object' ? slotProps.input : undefined),
          endAdornment: (
            <InputAdornment position='end'>
              <IconButton
                aria-label={toggleLabel}
                title={toggleLabel}
                onClick={() => setVisible((v) => !v)}
                edge='end'
                size='small'
              >
                {visible ? <VisibilityOff fontSize='small' /> : <Visibility fontSize='small' />}
              </IconButton>
            </InputAdornment>
          ),
        },
      }}
    />
  );
};
