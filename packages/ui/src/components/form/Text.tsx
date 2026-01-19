import { styled, type Theme } from '@mui/material/styles';
import { css } from '@emotion/react';

/**
 * 型定義
 */
type TextVariant = 'pageTitle' | 'sectionTitle' | 'body' | 'description' | 'help';

type TextTone = 'default' | 'muted';

type TextProps = {
  variant?: TextVariant;
  tone?: TextTone;
  maxLines?: number;
  last?: boolean;
};

/**
 * 行数制限ヘルパー
 * @param lines 制限する行数
 */
const lineClamp = (lines: number) => css`
  display: -webkit-box;
  -webkit-line-clamp: ${lines};
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

/**
 * Variantごとのスタイルを取得
 * @param theme MUIテーマ
 * @param variant テキストの種類
 */
const getVariantStyle = (theme: Theme, variant: TextVariant) => {
  const styles: Record<TextVariant, ReturnType<typeof css>> = {
    pageTitle: css`
      font-size: 32px;
      font-weight: 700;
      line-height: 1.3;
      letter-spacing: 0.01em;
      margin-bottom: 16px;
      border-bottom: 1px solid ${theme.palette.divider};
    `,
    sectionTitle: css`
      font-size: 18px;
      font-weight: 600;
      line-height: 1.4;
      margin-bottom: 16px;
      border-bottom: 1px solid ${theme.palette.divider};
    `,
    body: css`
      font-size: 14px;
      line-height: 1.6;
    `,
    description: css`
      font-size: 13px;
      line-height: 1.5;
    `,
    help: css`
      font-size: 12px;
      line-height: 1.5;
    `,
  };
  return styles[variant];
};

/**
 * Tone (Color) スタイルを取得
 * @param theme MUIテーマ
 * @param tone カラーのトーン
 */
const getToneStyle = (theme: Theme, tone: TextTone = 'default') => {
  const map = {
    default: theme.palette.text.primary,
    muted: theme.palette.text.secondary,
  };
  return css`
    color: ${map[tone]};
  `;
};

/**
 * テキストコンポーネント
 */
export const Text = styled('p', {
  // transient props を使用して、独自propsがDOMに渡るのを防ぐ
  shouldForwardProp: (prop) => !['variant', 'tone', 'maxLines', 'last'].includes(prop as string),
})<TextProps>(
  ({ theme, variant = 'body', tone = 'default', maxLines, last }) => css`
    margin: 0;

    /* Variant の適用 */
    ${getVariantStyle(theme, variant)}

    /* Tone (Color) の適用 */
    ${getToneStyle(theme, tone)}

    /* 行数制限の適用 */
    ${maxLines && lineClamp(maxLines)}

    /* 最後の要素としてのマージン調整 */
    ${last &&
    css`
      margin-bottom: 16px;
    `}

    /* 共通アニメーション */
    transition: color 0.2s ease, opacity 0.2s ease;
  `
);
