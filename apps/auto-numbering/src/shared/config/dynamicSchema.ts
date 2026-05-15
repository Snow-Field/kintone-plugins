import { type ZodType } from 'zod';
import { PluginConfigSchema, type PluginConfig } from '@/shared/config/staticSchema';
import { RESET_TIMING } from '@/shared/constant/numbering';

/**
 * 動的な検証を含むスキーマを生成する
 * @param fieldCodes アプリに存在するフィールドコードのリスト
 */
export const createConfigSchema = (fieldCodes: string[]): ZodType<PluginConfig> => {
  const fieldCodeSet = new Set(fieldCodes);

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

      // 2. formatParts 内の fieldCode の存在チェック
      setting.formatParts.forEach((part, partIndex) => {
        if (part.type === 'field' && !fieldCodeSet.has(part.fieldCode)) {
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
    });
  });
};
