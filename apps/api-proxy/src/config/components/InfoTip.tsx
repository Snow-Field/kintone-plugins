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
      <Box component='ul' sx={{ m: 0, pl: 2, fontSize: 13, lineHeight: 1.7 }}>
        {lines.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </Box>
    }
    slotProps={{ tooltip: { sx: { maxWidth: 420 } } }}
  >
    <IconButton size='small' aria-label={label} sx={{ p: 0.25, color: 'text.secondary' }}>
      <InfoOutlinedIcon sx={{ fontSize: 18 }} />
    </IconButton>
  </Tooltip>
);

/** 見出しと ⓘ を1行に並べる */
export const LabelWithTip: FC<Props & { title: string }> = ({ title, label, lines }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
    <Box component='span' sx={{ fontSize: 14, fontWeight: 600 }}>
      {title}
    </Box>
    <InfoTip label={label} lines={lines} />
  </Box>
);
