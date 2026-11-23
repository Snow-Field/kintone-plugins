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
    {/*
      日本語のフォントは上下の余白が対称でないので、行の中央に ⓘ を置くと、字より下に見える。
      text-box で字の上下の余白を切り落とし、字の形（大文字の高さとベースライン）で中央をそろえる。
      対応していないブラウザ（Firefox など）では、今までどおりの位置になる
    */}
    <Box component='span' sx={{ textBox: 'trim-both cap alphabetic' }}>
      {title}
    </Box>
    <InfoTip label={label} lines={lines} />
  </Box>
);
