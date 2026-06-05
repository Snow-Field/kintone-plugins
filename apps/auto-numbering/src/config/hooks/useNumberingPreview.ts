import { useMemo } from 'react';
import { type NumberingSetting } from '@/shared/config';
import {
  buildFormatString,
  buildNumberingValue,
} from '@/shared/feature/numbering/services/formatService';
import { padZero } from '@/shared/feature/numbering/utils/string';
import { formatDate, createDateContext } from '@/shared/feature/numbering/utils/date';

/**
 * 採番プレビューを生成するカスタムフック
 * サンプルデータを使用してプレビューを表示
 */
export const useNumberingPreview = (setting: NumberingSetting | undefined) => {
  const preview = useMemo(() => {
    if (!setting) {
      return { value: null, error: null };
    }

    try {
      // サンプルレコードデータ（フィールド値のモック）
      const sampleRecord: Record<string, { value: string | number }> = {
        // サンプルフィールド値
        部門: { value: '営業部' },
        担当者: { value: '山田太郎' },
        分類: { value: 'A' },
      };

      // フォーマットパーツを解決（未設定のパーツはスキップ）
      const resolvedParts = setting.formatParts
        .map((part) => {
          if (part.type === 'text') {
            // 値が未設定の場合はスキップ
            if (!part.value) return null;
            return { type: 'text' as const, value: part.value };
          }
          if (part.type === 'field') {
            // fieldCodeが未設定の場合はスキップ
            if (!part.fieldCode) return null;
            // サンプルレコードから値を取得、なければフィールドコードを表示
            const fieldValue = sampleRecord[part.fieldCode]?.value;
            return {
              type: 'field' as const,
              value: fieldValue !== undefined ? String(fieldValue) : `[${part.fieldCode}]`,
            };
          }
          if (part.type === 'date') {
            // sourceまたはformatが未設定の場合はスキップ
            if (!part.source || !part.format) return null;
            // 現在日時または固定日時でプレビュー
            const dateContext = createDateContext();
            const formattedDate = formatDate(dateContext, part.format);
            return { type: 'date' as const, value: formattedDate };
          }
          return null;
        })
        .filter((part): part is NonNullable<typeof part> => part !== null);

      // フォーマット文字列を構築
      const formatString = buildFormatString(resolvedParts, setting.connector);

      // 連番をゼロパディング
      const { serialConfig } = setting;
      const serialString = padZero(serialConfig.initialValue, serialConfig.digit);

      // 最終的な採番値を構築
      const numberingValue = buildNumberingValue(
        formatString,
        serialString,
        serialConfig.position,
        setting.connector
      );

      return { value: numberingValue, error: null };
    } catch (error) {
      return {
        value: null,
        error: error instanceof Error ? error.message : '不明なエラーが発生しました',
      };
    }
  }, [setting]);

  return preview;
};
