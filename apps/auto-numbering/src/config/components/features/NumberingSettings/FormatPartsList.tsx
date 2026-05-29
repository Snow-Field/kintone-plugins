import { type FC } from 'react';
import { useFormContext, useFieldArray } from 'react-hook-form';
import { Box, Button, IconButton, Tooltip, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import DeleteIcon from '@mui/icons-material/Delete';
import { type PluginConfig } from '@/shared/config';
import { FormatPartItem } from './FormatPartItem';

type Props = {
  basePath: string;
};

/**
 * フォーマットパーツ一覧コンポーネント
 * 上下ボタンで並び替え可能
 */
export const FormatPartsList: FC<Props> = ({ basePath }) => {
  const { control } = useFormContext<PluginConfig>();

  const { fields, append, remove, move } = useFieldArray({
    control,
    name: `${basePath}.formatParts` as never,
  });

  const handleAddPart = () => {
    // デフォルトでテキストパーツを追加
    append({ type: 'text', value: '' } as never);
  };

  const handleMoveUp = (index: number) => {
    if (index > 0) {
      move(index, index - 1);
    }
  };

  const handleMoveDown = (index: number) => {
    if (index < fields.length - 1) {
      move(index, index + 1);
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {fields.length === 0 && (
        <Typography variant='body2' color='text.secondary'>
          フォーマットパーツが設定されていません。パーツを追加してください。
        </Typography>
      )}

      {fields.map((field, index) => (
        <Box
          key={field.id}
          sx={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 1,
            p: 2,
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 1,
            bgcolor: 'background.paper',
          }}
        >
          {/* 並び替えボタン */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, pt: 1 }}>
            <Tooltip title='上に移動'>
              <span>
                <IconButton size='small' onClick={() => handleMoveUp(index)} disabled={index === 0}>
                  <ArrowUpwardIcon fontSize='small' />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title='下に移動'>
              <span>
                <IconButton
                  size='small'
                  onClick={() => handleMoveDown(index)}
                  disabled={index === fields.length - 1}
                >
                  <ArrowDownwardIcon fontSize='small' />
                </IconButton>
              </span>
            </Tooltip>
          </Box>

          {/* パーツ編集エリア */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <FormatPartItem basePath={`${basePath}.formatParts.${index}`} partIndex={index} />
          </Box>

          {/* 削除ボタン */}
          <Tooltip title='このパーツを削除'>
            <IconButton size='small' color='error' onClick={() => remove(index)} sx={{ mt: 1 }}>
              <DeleteIcon fontSize='small' />
            </IconButton>
          </Tooltip>
        </Box>
      ))}

      {/* パーツ追加ボタン */}
      <Button
        variant='outlined'
        startIcon={<AddIcon />}
        onClick={handleAddPart}
        sx={{ borderStyle: 'dashed' }}
      >
        パーツを追加
      </Button>
    </Box>
  );
};
