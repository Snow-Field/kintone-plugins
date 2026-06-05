import { type ZodType } from 'zod';
import { type KintoneFormFieldProperty } from '@kintone/rest-api-client';
import { PluginConfigSchema, type PluginConfig } from '@/shared/config/staticSchema';
import { RESET_TIMING, DATE_FORMATS } from '@/shared/constant/numbering';

/**
 * リセットタイミングに必要な最小日付フォーマットを判定
 */
const getRequiredDateFormatsForResetTiming = (
  resetTiming: string
): (typeof DATE_FORMATS)[keyof typeof DATE_FORMATS][] | null => {
  switch (resetTiming) {
    case RESET_TIMING.YEARLY:
      // 年次リセット: 年を含むフォーマットが必要
      return [
        DATE_FORMATS.YYYY,
        DATE_FORMATS.YY,
        DATE_FORMATS.YYYYMM,
        DATE_FORMATS.YYMM,
        DATE_FORMATS.YYYYMMDD,
        DATE_FORMATS.YYMMDD,
      ];
    case RESET_TIMING.MONTHLY:
      // 月次リセット: 年月を含むフォーマットが必要
      return [DATE_FORMATS.YYYYMM, DATE_FORMATS.YYMM, DATE_FORMATS.YYYYMMDD, DATE_FORMATS.YYMMDD];
    case RESET_TIMING.DAILY:
      // 日次リセット: 年月日を含むフォーマットが必要
      return [DATE_FORMATS.YYYYMMDD, DATE_FORMATS.YYMMDD];
    case RESET_TIMING.NONE:
      // リセットなし: 日付フォーマット不要
      return null;
    default:
      return null;
  }
};

/** フィールド情報の型（usePluginForm と互換） */
type FieldInfo = {
  code: string;
  type: KintoneFormFieldProperty.OneOf['type'];
};

/**
 * 動的な検証を含むスキーマを生成する
 * @param fields アプリに存在するフィールド情報のリスト
 */
export const createConfigSchema = (fields: FieldInfo[]): ZodType<PluginConfig> => {
  const fieldCodeSet = new Set(fields.map((f) => f.code));

  return PluginConfigSchema.superRefine((config, ctx) => {
    // 採番設定ごとにバリデーション
    config.numberingSettings.forEach((setting, settingIndex) => {
      const basePath = ['numberingSettings', settingIndex];

      // 1. resultFieldCode の存在チェック
      if (!fieldCodeSet.has(setting.resultFieldCode)) {
        ctx.addIssue({
          code: 'custom',
          message: `フィールドコード "${setting.resultFieldCode}" がアプリ内に見つかりません`,
          path: [...basePath, 'resultFieldCode'],
        });
      }

      // 2. formatParts 内の fieldCode の存在チェック（値が設定されている場合のみ）
      setting.formatParts.forEach((part, partIndex) => {
        if (part.type === 'field' && part.fieldCode && !fieldCodeSet.has(part.fieldCode)) {
          ctx.addIssue({
            code: 'custom',
            message: `フィールドコード "${part.fieldCode}" がアプリ内に見つかりません`,
            path: [...basePath, 'formatParts', partIndex, 'fieldCode'],
          });
        }
      });

      // 3. serialConfig のバリデーション
      const { serialConfig } = setting;

      // resetTiming が 'none' の場合、serialFieldCode が必須
      if (serialConfig.resetTiming === RESET_TIMING.NONE) {
        if (!serialConfig.serialFieldCode) {
          ctx.addIssue({
            code: 'custom',
            message: 'リセットタイミングが "なし" の場合、連番フィールドコードは必須です',
            path: [...basePath, 'serialConfig', 'serialFieldCode'],
          });
        } else if (!fieldCodeSet.has(serialConfig.serialFieldCode)) {
          ctx.addIssue({
            code: 'custom',
            message: `フィールドコード "${serialConfig.serialFieldCode}" がアプリ内に見つかりません`,
            path: [...basePath, 'serialConfig', 'serialFieldCode'],
          });
        }
      }

      // resetTiming が 'none' 以外の場合、serialFieldCode は不要（警告）
      if (
        serialConfig.resetTiming !== RESET_TIMING.NONE &&
        serialConfig.serialFieldCode !== undefined
      ) {
        ctx.addIssue({
          code: 'custom',
          message: 'リセットタイミングが "なし" 以外の場合、連番フィールドコードは使用されません',
          path: [...basePath, 'serialConfig', 'serialFieldCode'],
        });
      }

      // 4. resultFieldCode と serialFieldCode の重複チェック
      if (
        serialConfig.serialFieldCode &&
        serialConfig.serialFieldCode === setting.resultFieldCode
      ) {
        ctx.addIssue({
          code: 'custom',
          message: '採番結果フィールドと連番フィールドは異なるフィールドを指定してください',
          path: [...basePath, 'serialConfig', 'serialFieldCode'],
        });
      }

      // 5. 複数の採番設定間での resultFieldCode の重複チェック
      const resultFieldCodes = config.numberingSettings.map((s) => s.resultFieldCode);
      const duplicateResultFields = resultFieldCodes.filter(
        (code, index) => resultFieldCodes.indexOf(code) !== index
      );
      if (duplicateResultFields.includes(setting.resultFieldCode)) {
        ctx.addIssue({
          code: 'custom',
          message: `フィールドコード "${setting.resultFieldCode}" は既に他の採番設定で使用されています`,
          path: [...basePath, 'resultFieldCode'],
        });
      }

      // 6. リセットタイミングと日付フォーマットの整合性チェック
      const { resetTiming } = serialConfig;
      const requiredFormats = getRequiredDateFormatsForResetTiming(resetTiming);

      if (requiredFormats !== null) {
        // リセットタイミングが設定されている場合、適切な日付フォーマットが必要
        const hasValidDateFormat = setting.formatParts.some((part) => {
          if (part.type !== 'date') return false;
          if (!part.format) return false;
          return requiredFormats.includes(part.format);
        });

        if (!hasValidDateFormat) {
          const resetTimingLabel =
            resetTiming === RESET_TIMING.YEARLY
              ? '年次リセット'
              : resetTiming === RESET_TIMING.MONTHLY
                ? '月次リセット'
                : resetTiming === RESET_TIMING.DAILY
                  ? '日次リセット'
                  : resetTiming;

          const requiredFormatLabel =
            resetTiming === RESET_TIMING.YEARLY
              ? 'YYYY, YY, YYYYMM, YYMM, YYYYMMDD, YYMMDD のいずれか'
              : resetTiming === RESET_TIMING.MONTHLY
                ? 'YYYYMM, YYMM, YYYYMMDD, YYMMDD のいずれか'
                : resetTiming === RESET_TIMING.DAILY
                  ? 'YYYYMMDD, YYMMDD のいずれか'
                  : '';

          ctx.addIssue({
            code: 'custom',
            message: `${resetTimingLabel}を使用する場合、フォーマットパーツに日付（${requiredFormatLabel}）を含める必要があります`,
            path: [...basePath, 'serialConfig', 'resetTiming'],
          });
        }
      }
    });
  });
};
