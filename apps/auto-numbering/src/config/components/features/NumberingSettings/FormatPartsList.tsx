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
 * インライン形式で1行ずつ表示
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

  const isMaxReached = fields.length >= 3;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      {fields.length === 0 && (
        <Typography variant='caption' color='text.secondary'>
          フォーマットパーツが設定されていません。パーツを追加してください。
        </Typography>
      )}

      {/* パーツを縦に並べて表示 */}
      {fields.map((field, index) => (
        <Box
          key={field.id}
          sx={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 1,
            p: 1,
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 1,
            bgcolor: 'background.paper',
          }}
        >
          {/* パーツ番号 */}
          <Typography
            variant='body2'
            sx={{
              minWidth: 20,
              fontWeight: 500,
              color: 'text.secondary',
              pt: 1,
            }}
          >
            {index + 1}.
          </Typography>

          {/* パーツ編集エリア */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <FormatPartItem basePath={`${basePath}.formatParts.${index}`} partIndex={index} />
          </Box>

          {/* 操作ボタン */}
          <Box sx={{ display: 'flex', gap: 0.5, pt: 0.5 }}>
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
            <Tooltip title='削除'>
              <IconButton size='small' color='error' onClick={() => remove(index)}>
                <DeleteIcon fontSize='small' />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      ))}

      {/* パーツ追加ボタン */}
      <Button
        variant='outlined'
        startIcon={<AddIcon />}
        onClick={handleAddPart}
        disabled={isMaxReached}
        sx={{ borderStyle: 'dashed', alignSelf: 'flex-start' }}
        size='small'
      >
        {isMaxReached ? 'パーツは最大3つまでです' : 'パーツを追加'}
      </Button>
    </Box>
  );
};
