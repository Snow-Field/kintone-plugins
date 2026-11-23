import type { FC } from 'react';
import { Box, IconButton, Tooltip } from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

type Props = {
  /** 何についての説明か（読み上げに使う。例: 'URL の説明'） */
  label: string;
  /** 説明。1つの要素を1行（箇条書き）で出す */
  lines: string[];
};

/** 見出しの横の ⓘ。カーソルを乗せる（キーボードではフォーカスする）と説明を出す */
export const InfoTip: FC<Props> = ({ label, lines }) => (
  <Tooltip
    arrow
    placement='right-start'
    title={
      // kintone の CSS で箇条書きの記号が消えるので、記号は自分で出す
      <Box
        sx={{ display: 'flex', flexDirection: 'column', gap: 0.75, fontSize: 13, lineHeight: 1.6 }}
      >
        {lines.map((line) => (
          <Box key={line} sx={{ display: 'flex', gap: 0.5 }}>
            <span aria-hidden>・</span>
            <span>{line}</span>
          </Box>
        ))}
      </Box>
    }
    slotProps={{ tooltip: { sx: { maxWidth: 420 } } }}
  >
    <IconButton
      size='small'
      aria-label={label}
      sx={{ p: 0.25, color: 'text.secondary', verticalAlign: 'middle' }}
    >
      <InfoOutlinedIcon sx={{ fontSize: 18 }} />
    </IconButton>
  </Tooltip>
);

/** 見出しの文字と ⓘ を、縦の中央でそろえて並べる */
export const TitleWithTip: FC<Props & { title: string }> = ({ title, label, lines }) => (
  <Box component='span' sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
    {title}
    <InfoTip label={label} lines={lines} />
  </Box>
);
