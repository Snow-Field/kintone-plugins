import { styled, type Theme } from '@mui/material/styles';
import { css } from '@emotion/react';

/**
 * 型定義
 */
type TextVariant = 'sectionTitle' | 'description';

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
    sectionTitle: css`
      font-size: 18px;
      font-weight: 600;
      line-height: 1.4;
      margin-bottom: 12px;
      border-bottom: 1px solid ${theme.palette.divider};
    `,
    description: css`
      font-size: 13px;
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
 * transient props を使用して、独自propsがDOMに渡るのを防ぐ
 */
const shouldForwardProp = (propName: string) =>
  !['variant', 'tone', 'maxLines', 'last'].includes(propName);

/**
 * テキストコンポーネント
 */
export const Text = styled('p', { shouldForwardProp })<TextProps>(
  ({ theme, variant = 'description', tone = 'default', maxLines, last }) => css`
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
      margin-bottom: 24px;
    `}

    /* 共通アニメーション */
    transition: color 0.2s ease, opacity 0.2s ease;
  `
);
